const cvs = document.querySelector('canvas#cvs');
const ctx = cvs.getContext('2d');

const width = cvs.width = window.innerWidth,
    height = cvs.height = window.innerHeight;

let x = y = 0;

const start = new Date().getTime();

const draw = () => {
    requestAnimationFrame(draw);

    console.log(`${x / ((new Date().getTime() - start) / 1000)}fps`);

    ctx.clearRect(0, 0, width, height);
    ctx.fillRect(0, 0, ++x, ++y);
};
draw();