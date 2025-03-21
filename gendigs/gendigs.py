import json
import unicodedata
import os
from jinja2 import FileSystemLoader, Environment
def unicode_name(char):
    try:
        return unicodedata.name(char)
    except ValueError:
        return f"U+{ord(char):04X}"
fs_loader = FileSystemLoader(searchpath=os.path.split(__file__)[0])
jinja_env = Environment(loader=fs_loader)
digs = {}
diglist = []
indices = {}
with open("diglist.txt", "r") as f:
    index=1
    for line in f:
        line_patched = line.replace("{", "(").replace("}", ")").strip().rstrip(",")
        if not line_patched or line_patched.startswith("#"):
            continue
        char1, char2, code = eval(line_patched)
        digs[char1 + char2] = chr(code)
        diglist.append(
            {
                "primary": char1 + char2,
                "secondary": char2 + char1,
                "secondary-taken": None,
                "char": chr(code),
                "utf": unicode_name(chr(code)),
            }
        )
        indices[char1+char2]=index
        index+=1
print("Checking taken secondaries")
for dig in diglist:
    dig["secondary-taken"]=indices.get(dig["secondary"])
print("Generated", len(digs), "digs.")
json.dump(digs, open("digs.json", "w"))
print("Rendering digraph list.")
with open("digs.html", "w") as f:
    template = jinja_env.get_template("digs_template.html")
    f.write(template.render(diglist=diglist))
print("Done")
