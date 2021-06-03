import json
import sys

# specify the component that need to be updated
# the name should be matching with versions.json file
# TODO: when there is new component, this should be added automatically
originRepo=sys.argv[1]
# the new version should be used
# this will come from the build chain/dependency
newVersion=sys.argv[2]

if originRepo=="flow-osgi" :
  module="vaadin"
else :
  module="core"
    
with open('../versions.json','r') as data:
    versions = json.load(data)

print("Updating " + originRepo + " verson from: ")
print(versions[module][originRepo]["javaVersion"])
print("to: ")
versions[module][originRepo]["javaVersion"]=newVersion
print(versions[module][originRepo]["javaVersion"])

with open('../versions.json','w') as data:
    json.dump(versions,data,sort_keys=True, indent=4)
    data.write('\n')
