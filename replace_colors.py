import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Primary green -> royal blue
content = content.replace('bg-[#4A5D4E]', 'bg-blue-600')
content = content.replace('hover:bg-[#3E4C41]', 'hover:bg-blue-700')
content = content.replace('border-[#4A5D4E]', 'border-blue-600')
content = content.replace('text-[#4A5D4E]', 'text-blue-600')
content = content.replace('ring-[#4A5D4E]/20', 'ring-blue-600/30')
content = content.replace('hover:border-[#4A5D4E]/50', 'hover:border-blue-600/50')

# Neutral background (FDFBF7 -> slate-50, F4F1EA -> stone-100)
content = content.replace('bg-[#FDFBF7]', 'bg-slate-50')
content = content.replace('bg-[#F4F1EA]', 'bg-stone-100')
content = content.replace('bg-[#F4F1EA]/95', 'bg-stone-100/95')
content = content.replace('border-[#E2DED0]', 'border-slate-200')
content = content.replace('border-[#D1CAB8]', 'border-stone-200')

# Text colors
content = content.replace('text-[#2D3A30]', 'text-slate-900 font-extrabold') # making titles bold
content = content.replace('text-[#3E4C41]', 'text-slate-700')
content = content.replace('text-[#5F6C61]', 'text-slate-600')
content = content.replace('text-[#7A8B7E]', 'text-slate-500')
content = content.replace('text-[#FDFBF7]', 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold')

# Subtle accents
content = content.replace('bg-[#E9F0E0]', 'bg-blue-50')
content = content.replace('border-[#DDE5B6]', 'border-blue-200')
content = content.replace('bg-[#FFFDF9]', 'bg-slate-50')

# Button specific styling replacement where user wanted glow
# We replaced text-[#FDFBF7] with white + drop-shadow so the primary buttons will automatically have it.

# Now wrap sections with their specific colors
# activeTab === 'families'
families_wrap_start = r"{activeTab === 'families' && \(\s*<div className=\"space-y-6\">"
families_wrap_replace = r"{activeTab === 'families' && (\n                <div className=\"space-y-6 bg-indigo-50/40 border border-indigo-200 rounded-3xl p-4 sm:p-6 shadow-sm\">"
content = re.sub(families_wrap_start, families_wrap_replace, content)

# activeTab === 'services'
services_start = r"{activeTab === 'services' && \(\s*<ServiceRegister"
services_replace = r"{activeTab === 'services' && (\n                <div className=\"bg-amber-50/40 border border-amber-200 rounded-3xl p-4 sm:p-6 shadow-sm\">\n                  <ServiceRegister"
content = re.sub(services_start, services_replace, content)

services_end = r"isAdmin=\{isAdmin\}\n\s*/>\n\s*\)}"
services_end_replace = r"isAdmin={isAdmin}\n                  />\n                </div>\n              )}"
content = re.sub(services_end, services_end_replace, content)

# activeTab === 'donations'
donations_start = r"{activeTab === 'donations' && \(\s*<Donations"
donations_replace = r"{activeTab === 'donations' && (\n                <div className=\"bg-teal-50/40 border border-teal-200 rounded-3xl p-4 sm:p-6 shadow-sm\">\n                  <Donations"
content = re.sub(donations_start, donations_replace, content)

donations_end = r"currentUser=\{currentUser\}\n\s*/>\n\s*\)}"
donations_end_replace = r"currentUser={currentUser}\n                  />\n                </div>\n              )}"
content = re.sub(donations_end, donations_end_replace, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

