"""Run: blender --background --python create-model.py
The browser's campus.json is the shared source of building dimensions.
This is a stylized study, not a measured model of the university.
"""
import bpy, json, math, os
from pathlib import Path
ROOT=Path(__file__).resolve().parent
data=json.loads((ROOT/'dist/campus.json').read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
materials={}
def mat(color):
    if color not in materials:
        m=bpy.data.materials.new(color)
        rgb=tuple(int(color.lstrip('#')[i:i+2],16)/255 for i in (0,2,4))
        m.diffuse_color=(*rgb,1)
        m.use_nodes=True
        bs=m.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Base Color'].default_value=(*rgb,1)
        bs.inputs['Roughness'].default_value=.82
        materials[color]=m
    return materials[color]
def cube(name,x,y,z,w,h,d,color):
    # Browser is Y-up; Blender is Z-up. Map ground z to Blender -y.
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y+h/2))
    o=bpy.context.object;o.name=name;o.dimensions=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat(color));return o
cube('Campus plinth',0,-.82,0,36,.78,29,'#c8cabc')
cube('Campus pavement',0,-.04,0,35.6,.08,28.6,'#d4d5c8')
cube('West road',-16.7,.01,0,1.8,.025,28,'#a6aba1')
cube('South road',0,.01,13.2,35,.025,1.8,'#a6aba1')
for b in data['buildings']:
    x,z,w,d,h=[b[k] for k in ('x','z','w','d','h')]
    cube('Building '+b['id'],x,.04,z,w,h,d,b['color'])
    cube('Roof '+b['id'],x,h+.04,z,w+.12,.14,d+.12,'#d6d6ca')
    cube('Rooftop '+b['id'],x,h+.18,z,w-.25,.08,d-.25,'#a5aa9d')
    cube('Equipment '+b['id'],x+w*.19,h+.26,z,w*.33,.42,d*.35,'#b5b8ac')
    rows=b['floors'];cols=int(w/.54);ww=(w-.4)/cols
    # Merge all windows into one object per building for easy editing.
    windows=[]
    for i in range(rows):
        yy=.45+i*(h-.5)/rows
        for j in range(cols):
            xx=x-w/2+.2+ww*(j+.5)
            for sign in (-1,1):windows.append(cube('Window',xx,yy,z+sign*(d/2+.012),ww*.68,(h-.5)/rows*.49,.025,'#677c78'))
        for j in range(int(d/.65)):
            zz=z-d/2+.32+j*(d-.5)/int(d/.65)
            for sign in (-1,1):windows.append(cube('Window',x+sign*(w/2+.012),yy,zz,.025,(h-.5)/rows*.49,.39,'#677c78'))
    bpy.ops.object.select_all(action='DESELECT')
    for o in windows:o.select_set(True)
    bpy.context.view_layer.objects.active=windows[0];bpy.ops.object.join();windows[0].name='Windows '+b['id']
    if b.get('kind')=='tower':
        for j in range(cols+1):cube('Tower rib',x-w/2+.14+j*(w-.28)/cols,.15,z+d/2+.07,.09,h-.12,.17,'#d0d0c3')
    cube('Entrance '+b['id'],x,.06,z+d/2+.04,.8,.85,.07,'#4f655f')
for x,z in [(-14,-10),(-14,-6),(-14,-2),(-14,3),(-14,8),(-7,10.5),(-1,11),(5.6,10.8),(13.7,10.8),(15,-7),(15,-2),(15,3),(-7,-3),(-1,3.5),(2,3.6),(5,3.8),(8,3.6),(-4,-12),(4,-12),(10,-12)]:
    cube('Tree trunk',x,.02,z,.13,.9,.13,'#887b61')
    for y,r,h in [(.6,.7,1.7),(1.2,.52,1.4)]:
        bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=0,depth=h,location=(x,-z,y+h/2))
        bpy.context.object.name='Tree canopy';bpy.context.object.data.materials.append(mat('#7d8b61'))
for s in data['spots']:
    b=next(b for b in data['buildings'] if b['id']==s['id'])
    bpy.ops.object.empty_add(type='PLAIN_AXES',location=(b['x'],-b['z'],b['h']+1))
    bpy.context.object.name='HOTSPOT_'+s['id'];bpy.context.object['title']=s['title']
bpy.ops.object.light_add(type='SUN',location=(-10,-10,20));bpy.context.object.rotation_euler=(.4,-.5,-.4);bpy.context.object.data.energy=2
bpy.ops.object.camera_add(location=(32,-42,36));camera=bpy.context.object
from mathutils import Vector
camera.rotation_euler=(Vector((0,0,2))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=48
bpy.context.scene.camera=camera
bpy.context.scene.world.color=(.75,.75,.7)
bpy.context.scene.render.resolution_x=1400;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
bpy.context.scene['model_note']=data['note']
(ROOT/'models').mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/nishiwaseda-study.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist/nishiwaseda-study.glb'),export_format='GLB',export_cameras=False,export_lights=False)
print('MODEL_EXPORT_SUCCESS')
