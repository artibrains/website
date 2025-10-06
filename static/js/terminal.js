window.CustomTerminal = (function () {
    const containerId = "custom-terminal";
    const bodyId = "custom-terminal-body";
    const clearButtonId = "terminal-clear-btn";
    let body = null;
    let clearButton = null;

    function init() {
        body = document.getElementById(bodyId);
        clearButton = document.getElementById(clearButtonId);

        if (clearButton) {
            clearButton.addEventListener('click', clear);
        }
    }

    function write(text, isPrompt = false) {
        if (body) {
            const pre = document.createElement('pre');
            pre.className = isPrompt ? 'prompt' : 'output';
            pre.textContent = (isPrompt ? '> ' : '') + text;
            body.appendChild(pre);
            body.scrollTop = body.scrollHeight;
        }
    }

    function clear() {
        if (body) {
            body.innerHTML = ''; // Remove all content
            // Optionally, add a message indicating it was cleared
            const pre = document.createElement('pre');
            pre.className = 'output';
            pre.textContent = 'Terminal limpiado.';
            body.appendChild(pre);
            body.scrollTop = body.scrollHeight;
        }
    }

    // Inicializa al cargar
    document.addEventListener("DOMContentLoaded", init);

    // Expón funciones públicas
    return {
        write,
        clear // Expose clear if it needs to be called programmatically elsewhere
    };
})();