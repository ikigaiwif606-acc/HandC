(() => {
  'use strict';
  const dialog = document.getElementById('planViewer');
  if (!dialog) return;
  const image = document.getElementById('planViewerImage');
  const stage = document.getElementById('planViewerStage');
  const heading = document.getElementById('planViewerHeading');
  const output = document.getElementById('planZoom');
  const close = document.getElementById('planViewerClose');
  const zoomIn = document.getElementById('planZoomIn');
  const zoomOut = document.getElementById('planZoomOut');
  const zoomReset = document.getElementById('planZoomReset');
  const choices = Array.from(dialog.querySelectorAll('[data-plan-choice]'));
  const views = {
    studio: {
      src: 'assets/studio-floor-plan-rev02.png',
      title: 'Full studio layout',
      alt: 'Full studio concept plan, with reception at the front, sauna and two pools, separate changing suites around an open centre passage, and existing toilets at the rear-left.',
      width: 1344,
      height: 3528
    },
    suites: {
      src: 'assets/changing-suites-rev02.png',
      title: 'Changing suites and centre passage',
      alt: 'Men’s suite on the left and women’s suite on the right, each with two showers, a private changing cubicle and a basin. The open centre passage connects to the rear hall, existing toilets and plant room.',
      width: 1340,
      height: 996
    }
  };
  const zoomSteps = [1, 1.5, 2, 3, 4, 6];
  let view = 'studio';
  let zoomIndex = 0;
  let opener = null;
  let previousOverflow = '';

  function resize(resetScroll = false) {
    if (!dialog.open) return;
    const current = views[view];
    const style = getComputedStyle(stage);
    const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const fitWidth = view === 'studio' ? width : Math.min(width, height * current.width / current.height);
    image.style.width = Math.max(1, fitWidth * zoomSteps[zoomIndex]) + 'px';
    output.value = zoomIndex === 0 ? (view === 'studio' ? 'Width' : 'Fit') : Math.round(zoomSteps[zoomIndex] * 100) + '%';
    zoomReset.textContent = view === 'studio' ? 'Fit width' : 'Fit';
    zoomOut.disabled = zoomIndex === 0;
    zoomIn.disabled = zoomIndex === zoomSteps.length - 1;
    if (resetScroll) {
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
    }
  }

  function selectView(name) {
    if (!views[name]) return;
    view = name;
    zoomIndex = 0;
    const current = views[name];
    heading.textContent = current.title;
    image.src = current.src;
    image.alt = current.alt;
    image.width = current.width;
    image.height = current.height;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.planChoice === name)));
    resize(true);
  }

  document.querySelectorAll('[data-plan-open]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.planOpen;
      if (!views[name]) return;
      if (typeof dialog.showModal !== 'function') {
        window.open(views[name].src, '_blank', 'noopener');
        return;
      }
      opener = button;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      selectView(name);
      close.focus();
    });
  });
  choices.forEach(button => button.addEventListener('click', () => selectView(button.dataset.planChoice)));
  zoomIn.addEventListener('click', () => { zoomIndex = Math.min(zoomSteps.length - 1, zoomIndex + 1); resize(); });
  zoomOut.addEventListener('click', () => { zoomIndex = Math.max(0, zoomIndex - 1); resize(); });
  zoomReset.addEventListener('click', () => { zoomIndex = 0; resize(true); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    if (opener && opener.isConnected) opener.focus();
  });
  image.addEventListener('load', () => resize());
  window.addEventListener('resize', () => resize());
})();
