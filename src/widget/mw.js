(function () {
    function mount(el) {
        var slug = el.getAttribute('data-slug');
        if (!slug) return;
        var iframe = document.createElement('iframe');
        iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture');
        iframe.setAttribute('loading', 'eager'); // langsung render
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.style.border = '0';
        iframe.style.width = '100%';
        iframe.style.height = '120px'; // tinggi player; bisa responsif
        iframe.src = (window.MW_ORIGIN || 'https://musidget.vercel.app') + '/w/' + encodeURIComponent(slug);
        el.appendChild(iframe);
    }

    function init() {
        var nodes = document.querySelectorAll('.mw-embed');
        for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
