"""Build the exact browser room geometry as an editable Blender scene and GLB."""
import bpy, json, math, re, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
data=json.loads((ROOT/'dist/room-geometry.json').read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
collections={}
for part in data['meshes']:
    color=part['color']
    if color not in materials:
        m=bpy.data.materials.new(color)
        rgb=tuple(int(color.lstrip('#')[i:i+2],16)/255 for i in (0,2,4))
        m.diffuse_color=(*rgb,1);m.use_nodes=True
        bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1);bs.inputs['Roughness'].default_value=.8
        # Procedural materials for editable, close-up Blender viewing.
        name=part['name'].lower()
        wood=bool(re.search('floorboard|walnut|wood|tabletop|cabinet|bed frame|turned|bedpost',name))
        textile=bool(re.search('curtain|duvet|fabric|pillow|mattress|cushion|soft toy',name))
        plaster='wall' in name or 'ceiling' in name
        if wood or textile or plaster:
            nt=m.node_tree;coords=nt.nodes.new('ShaderNodeNewGeometry');mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1.5,55,8) if wood else (1,1,1)
            nt.links.new(coords.outputs['Position'],mapping.inputs[0]);noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3 if wood else 210 if textile else 115;noise.inputs['Detail'].default_value=3;nt.links.new(mapping.outputs[0],noise.inputs['Vector'])
            ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[1].position=.85
            ramp.color_ramp.elements[0].color=tuple(v*(.78 if wood else .95) for v in rgb)+(1,);ramp.color_ramp.elements[1].color=tuple(min(1,v*1.04) for v in rgb)+(1,)
            nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],bs.inputs['Base Color']);bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13 if wood else .18;bump.inputs['Distance'].default_value=.001 if wood else .0004
            nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],bs.inputs['Normal']);bs.inputs['Roughness'].default_value=.5 if wood else .92
        materials[color]=m
    group=part['name'].split(' / ')[0]
    if group not in collections:
        collection=bpy.data.collections.new(group);bpy.context.scene.collection.children.link(collection);collections[group]=collection
    p=part['positions'];verts=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)];faces=[(i,i+1,i+2) for i in range(0,len(verts),3)]
    mesh=bpy.data.meshes.new(part['name']);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(part['name'],mesh);collections[group].objects.link(obj);obj.data.materials.append(materials[color])
    obj.hide_render=bool(part.get('interiorOnly'))
    if part.get('interaction'):obj['interaction']=part['interaction']
    if part.get('smooth'):
        for polygon in mesh.polygons:polygon.use_smooth=True
spots=json.loads((ROOT/'dist/room.json').read_text(encoding='utf-8'))
for s in spots['spots']:
    b=next(b for b in spots['buildings'] if b['id']==s['id'])
    bpy.ops.object.empty_add(type='PLAIN_AXES',radius=.1,location=(b['x'],-b['z'],b['h']))
    bpy.context.object.name='HOTSPOT_'+s['id'];bpy.context.object['title']=s['title']
bpy.ops.object.light_add(type='AREA',location=(-.5,-.5,5));bpy.context.object.name='Softbox';bpy.context.object.data.energy=400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(4.7,-7.9,6.4));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1.2))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=6.3
s=bpy.context.scene;s.camera=camera;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.display.shading.show_shadows=True;s.display.shading.show_cavity=True;s.display.shading.cavity_type='BOTH';s.display.shading.background_type='WORLD';s.world.color=(.86,.845,.805)
s.render.resolution_x=1400;s.render.resolution_y=1200;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
s['model_note']=data['note'];s['source']='A single user-provided reference photograph. Dimensions are estimated.'
(ROOT/'models').mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/my-room.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/my-room.glb'),export_format='GLB',export_cameras=False,export_lights=False)
s.render.filepath=str(ROOT/'models/room-preview.png');bpy.ops.render.render(write_still=True)
for obj in bpy.context.scene.objects:
    if obj.name.startswith('Interior shell /'):obj.hide_render=False
for name,loc,energy,size,rotation in [
    ('Interior ceiling light',(.1,-.1,2.49),65,.8,(0,0,0)),
    ('Window soft light',(.3,1.7,1.7),40,1.3,(-math.pi/2,0,0)),
    ('Desk light',(.22,1.57,1.52),12,.65,(0,0,0))
]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.rotation_euler=rotation;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=(1,.92,.79)
bpy.ops.object.camera_add(location=(.72,-1.61,1.57));inside_camera=bpy.context.object;inside_camera.name='First person view';direction=Vector((-.145,.963,-.228));inside_camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();inside_camera.data.type='PERSP';inside_camera.data.lens=22
s.camera=inside_camera;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True;s.render.resolution_x=1280;s.render.resolution_y=900
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/my-room.blend'))
if '--cycles-preview' not in sys.argv:s.render.engine='BLENDER_WORKBENCH'
s.render.filepath=str(ROOT/'models/inside-preview.png');bpy.ops.render.render(write_still=True)
print('ROOM_MODEL_EXPORT_SUCCESS')
