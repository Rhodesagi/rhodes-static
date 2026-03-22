/* RhodesCards — Full Screen review mode */

RC.isFullScreen = false;

RC.toggleFullScreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(function() {
            RC.isFullScreen = true;
            document.body.classList.add('rc-fullscreen');
        }).catch(function() {});
    } else {
        document.exitFullscreen();
    }
};

document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
        RC.isFullScreen = false;
        document.body.classList.remove('rc-fullscreen');
    }
});
