var InjectionMap = {
  game: 'game',
  renderer: 'renderer',
  anims: 'anims',
  cache: 'cache',
  plugins: 'plugins',
  registry: 'registry',
  scale: 'scale',
  sound: 'sound',
  textures: 'textures',
  events: 'events',
  cameras: 'cameras',
  add: 'add',
  make: 'make',
  scenePlugin: 'scene',
  displayList: 'children',
  lights: 'lights',
  data: 'data',
  input: 'input',
  load: 'load',
  time: 'time',
  tweens: 'tweens',
  arcadePhysics: 'physics',
  impactPhysics: 'impact',
  matterPhysics: 'matter',
};
if (typeof PLUGIN_CAMERA3D) {
  InjectionMap.cameras3d = 'cameras3d';
}
if (typeof PLUGIN_FBINSTANT) {
  InjectionMap.facebook = 'facebook';
}
module.exports = InjectionMap;
