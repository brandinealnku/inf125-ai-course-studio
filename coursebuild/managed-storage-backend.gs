/**
 * CourseBuild v0.13 managed project storage backend.
 * Deploy as a SEPARATE Apps Script Web App from the Canvas/Gemini backend.
 *
 * Script Properties:
 *   COURSEBUILD_MANAGED_FOLDER_ID  required Google Drive folder ID
 *   COURSEBUILD_MANAGED_MAX_BYTES  optional max project JSON size (default 900000)
 *
 * Security model (pilot): workspaceToken is a bearer secret generated in the browser.
 * Only a SHA-256 hash of the token is used in Drive filenames/metadata. This is NOT
 * production authentication and should be replaced by real user identity before SaaS launch.
 */
const CB_MANAGED_SCHEMA='coursebuild-project-v1';
const CB_MANAGED_API='coursebuild-managed-storage-v1';

function doPost(e){
  try{
    const req=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    const handlers={
      managedPing:managedPing,
      listManagedProjects:listManagedProjects,
      saveManagedProject:saveManagedProject,
      loadManagedProject:loadManagedProject,
      deleteManagedProject:deleteManagedProject
    };
    if(!handlers[req.action]) throw new Error('Unsupported managed-storage action: '+req.action);
    return managedJson({ok:true,data:handlers[req.action](req)});
  }catch(err){return managedJson({ok:false,error:String(err&&err.message||err)});}
}
function managedJson(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function managedProps(){return PropertiesService.getScriptProperties();}
function managedFolder(){
  const id=managedProps().getProperty('COURSEBUILD_MANAGED_FOLDER_ID');
  if(!id) throw new Error('Missing COURSEBUILD_MANAGED_FOLDER_ID Script Property.');
  return DriveApp.getFolderById(id);
}
function managedMaxBytes(){return Math.max(100000,Number(managedProps().getProperty('COURSEBUILD_MANAGED_MAX_BYTES')||900000));}
function requireWorkspace(req){
  const token=String(req.workspaceToken||'').trim();
  if(token.length<32) throw new Error('Managed workspace token is missing or invalid.');
  return {token:token,hash:sha256Hex(token)};
}
function sha256Hex(value){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8)
    .map(function(b){const n=(b+256)%256;return ('0'+n.toString(16)).slice(-2);}).join('');
}
function safeId(value){return String(value||'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,180);}
function fileNameFor(workspaceHash,projectId){return 'coursebuild-managed-'+workspaceHash.slice(0,24)+'-'+safeId(projectId)+'.json';}
function findProjectFile(folder,workspaceHash,projectId){
  const it=folder.getFilesByName(fileNameFor(workspaceHash,projectId));
  return it.hasNext()?it.next():null;
}
function managedPing(req){const ws=requireWorkspace(req);managedFolder();return{api:CB_MANAGED_API,workspaceId:ws.hash.slice(0,12),ready:true};}
function listManagedProjects(req){
  const ws=requireWorkspace(req),folder=managedFolder(),prefix='coursebuild-managed-'+ws.hash.slice(0,24)+'-';
  const out=[],files=folder.getFiles();
  while(files.hasNext()){
    const f=files.next();if(f.getName().indexOf(prefix)!==0)continue;
    try{const env=JSON.parse(f.getBlob().getDataAsString());if(env.schema!==CB_MANAGED_SCHEMA)continue;out.push({id:env.id,name:env.name||'Untitled Course',createdAt:env.createdAt||'',updatedAt:env.updatedAt||'',courseCode:env.courseState&&env.courseState.profile&&env.courseState.profile.code||'',courseTitle:env.courseState&&env.courseState.profile&&env.courseState.profile.title||'',revision:Number(env.managedRevision||1)});}catch(ignore){}
  }
  out.sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt));});
  return{workspaceId:ws.hash.slice(0,12),projects:out};
}
function validateEnvelope(env){
  if(!env||env.schema!==CB_MANAGED_SCHEMA||!env.id||!env.courseState) throw new Error('Invalid CourseBuild project envelope.');
  const json=JSON.stringify(env);if(json.length>managedMaxBytes()) throw new Error('Project exceeds the managed-storage pilot size limit.');
  return json;
}
function saveManagedProject(req){
  const ws=requireWorkspace(req),folder=managedFolder(),incoming=req.project,projectId=incoming&&incoming.id;
  if(!projectId) throw new Error('Project ID is required.');
  const existing=findProjectFile(folder,ws.hash,projectId),serverExisting=existing?JSON.parse(existing.getBlob().getDataAsString()):null;
  const expected=req.expectedRevision==null?null:Number(req.expectedRevision);
  const currentRevision=Number(serverExisting&&serverExisting.managedRevision||0);
  if(expected!==null&&expected!==currentRevision) throw new Error('Managed project changed since it was loaded. Refresh before overwriting it.');
  const env=JSON.parse(JSON.stringify(incoming));env.managedRevision=currentRevision+1;env.managedUpdatedAt=new Date().toISOString();env.updatedAt=env.updatedAt||env.managedUpdatedAt;
  const body=validateEnvelope(env);
  if(existing) existing.setContent(body); else folder.createFile(fileNameFor(ws.hash,projectId),body,MimeType.PLAIN_TEXT);
  return{id:projectId,revision:env.managedRevision,updatedAt:env.managedUpdatedAt};
}
function loadManagedProject(req){
  const ws=requireWorkspace(req),id=String(req.projectId||'');if(!id)throw new Error('Project ID is required.');
  const file=findProjectFile(managedFolder(),ws.hash,id);if(!file)throw new Error('Managed project was not found.');
  const env=JSON.parse(file.getBlob().getDataAsString());if(env.schema!==CB_MANAGED_SCHEMA)throw new Error('Managed project schema is invalid.');
  return{project:env,revision:Number(env.managedRevision||1)};
}
function deleteManagedProject(req){
  const ws=requireWorkspace(req),id=String(req.projectId||'');if(!id)throw new Error('Project ID is required.');
  const file=findProjectFile(managedFolder(),ws.hash,id);if(!file)return{deleted:false,id:id};
  file.setTrashed(true);return{deleted:true,id:id};
}
