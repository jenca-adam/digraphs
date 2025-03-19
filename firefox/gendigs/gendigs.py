import json
digs = {}
with open("diglist.txt",'r') as f:
    for line in f:
        line_patched = line.replace('{','(').replace('}',')').strip().rstrip(',')
        if not line_patched or line_patched.startswith("#"):
            continue
        char1, char2, code = eval(line_patched)
        digs[char1+char2]=chr(code)
print("Generated", len(digs), "digs.")
json.dump(digs, open("digs.json",'w'))

