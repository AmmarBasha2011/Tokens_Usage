function renderNav(activePage) {
    const nav = document.createElement('nav');
    nav.className = "border-b border-gray-800 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50";
    nav.innerHTML = `
        <div class="flex items-center gap-8">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center">
                    <span class="text-black font-bold text-xl">I</span>
                </div>
                <h1 class="text-xl font-bold tracking-tighter uppercase">Inex <span class="text-cyan-500">Token</span></h1>
            </div>
            <div class="hidden md:flex items-center gap-6">
                <a href="/" class="nav-link text-cyan-500 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest">Dashboard</a>
                <a href="/docs" class="nav-link text-gray-500 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest">Documentation</a>
            </div>
        </div>
    `;
    document.body.prepend(nav);
}

function renderFooter() {
    const footer = document.createElement('footer');
    footer.className = "border-t border-gray-800 py-8 text-center text-gray-600 text-[10px] uppercase tracking-widest mt-12";
    footer.innerHTML = `&copy; 2026 INEX SYSTEMS &bull; ALL RIGHTS RESERVED`;
    document.body.appendChild(footer);
}
