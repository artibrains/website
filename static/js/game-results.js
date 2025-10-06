window.GameResultsModal = (function () {
    let modalElement = null;
    let closeButtonElement = null;
    let titleElement = null;
    let summaryElement = null;
    let detailsContainerElement = null;

    function init() {
        modalElement = document.getElementById('gameResultsModal');
        closeButtonElement = document.getElementById('gameResultsCloseButton');
        titleElement = document.getElementById('gameResultsTitle');
        summaryElement = document.getElementById('gameResultsSummary');
        detailsContainerElement = document.getElementById('gameResultsDetailsContainer');

        if (!modalElement || !closeButtonElement || !titleElement || !summaryElement || !detailsContainerElement) {
            console.warn('GameResultsModal: Not all modal elements were found. Ensure the HTML partial is included.');
            return;
        }

        closeButtonElement.onclick = hide;
        window.onclick = function (event) {
            if (event.target === modalElement) {
                hide();
            }
        };

    }

    function show(title, summary, detailsHtml) {
        if (!modalElement) {
            console.error('GameResultsModal: Modal element not initialized. Cannot show.');
            return;
        }
        titleElement.textContent = title;
        summaryElement.textContent = summary;
        detailsContainerElement.innerHTML = detailsHtml; // Allows flexible content for details

        modalElement.classList.add('active');

    }

    function hide() {
        if (!modalElement) {
            return;
        }
        modalElement.classList.remove('active');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        show: show,
        hide: hide
    };
})();
