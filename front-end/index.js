const cvs = document.querySelector('canvas#cvs');
const ctx = cvs.getContext('2d');

const scale_slider = document.querySelector('input#scale-slider');

// set canvas width and height to window width and height
// not responsive to resizing for now
let width, height, camera_width, camera_height;

// camera_width/height indicates FOV; can change with scale_slider
const scale_handler = () => {
    // if wide screen, then set scale factor for width (to prevent grid
    // from becoming excessively small)
    if (width > height) {
        camera_width = scale_slider.value;
        camera_height = scale_slider.value * height / width;
    }
    // else set scale factor for height
    else {
        camera_width = scale_slider.value * width / height;
        camera_height = scale_slider.value;
    }
};
const resize_handler = () => {
    width = cvs.width = window.innerWidth;
    height = cvs.height = window.innerHeight;
    scale_handler();
};
scale_slider.addEventListener('input', scale_handler);
window.addEventListener('resize', resize_handler);
resize_handler();

// camera_speed is movement speed, update_rate is how often position gets
// updated (in Hz)
const camera_speed = 0.05,
    update_rate = 1000;

// doc_coords are the positions of the points of interest
// this is a mockup for now -- later would be sent from
const doc_coords = [ [0, 1], [5, 6], [2, 4], [3, 6] ];

// camera_x, camera_y indicate center of viewable coordinates
let camera_x = camera_y = 0;

// translate document coordinates to screen coordinates
const dc2sc = (doc_x, doc_y) => [
    width / 2 + (doc_x - camera_x) * width / camera_width,
    height / 2 + (doc_y - camera_y) * height / camera_height
];

// translate screen coordinates to document coordinates
const sc2dc = (screen_x, screen_y) => [
    (screen_x - (width / 2)) * camera_width / width + camera_x,
    (screen_y - (height / 2)) * camera_height / height + camera_y
];

// for negative modulus
// see: https://stackoverflow.com/a/17323608/2397327
const mod = (n, m) => ((n % m) + m) % m;

// main painting loop
const draw = () => {
    ctx.clearRect(0, 0, width, height);

    // draw gridlines
    const grid_interval_x = grid_interval_y = 1,
        [camera_start_x, camera_start_y] = sc2dc(0, 0),
        grid_start_x = camera_start_x - mod(camera_start_x, grid_interval_x),
        grid_start_y = camera_start_y - mod(camera_start_y, grid_interval_y),
        grid_count = Math.max(camera_width / grid_interval_x, camera_height / grid_interval_y);

    for (let i = 0; i < grid_count; ++i) {
        const [screen_x, screen_y] = dc2sc(grid_start_x + grid_interval_x * (i+1), grid_start_y + grid_interval_y * (i+1));
        ctx.fillRect(screen_x, 0, 1, height);
        ctx.fillRect(0, screen_y, width, 1);
    }

    // draw documents
    for (const [doc_x, doc_y] of doc_coords) {
        // translate document coordinates to screen coordinates
        const [screen_x, screen_y] = dc2sc(doc_x, doc_y);
        ctx.fillRect(screen_x, screen_y, 20, 20);
    }

    const [left, top] = sc2dc(0, 0);
    const [right, bottom] = sc2dc(width, height);
    ctx.font = '20px Arial';
    ctx.fillText(`x: ${camera_x.toFixed(2)} y: ${camera_y.toFixed(2)}`, 10, 20);
    ctx.fillText(`(${left.toFixed(2)}, ${top.toFixed(2)}) -- (${right.toFixed(2)}, ${bottom.toFixed(2)})`, 10, 40);

    requestAnimationFrame(draw);
};
draw();

// key handlers
const pressed_keys = [0, 0, 0, 0];
const key_map = {
    'ArrowUp': 0, 'KeyW': 0,
    'ArrowDown': 1, 'KeyS': 1,
    'ArrowLeft': 2, 'KeyA': 2,
    'ArrowRight': 3, 'KeyD': 3,
};
document.addEventListener('keyup', ev => pressed_keys[key_map[ev.code]] = 0);
document.addEventListener('keydown', ev => pressed_keys[key_map[ev.code]] = 1);

// timed movement
const movement_handler = () => {
    if (pressed_keys[0])
        camera_y -= camera_speed;
    if (pressed_keys[1])
        camera_y += camera_speed;
    if (pressed_keys[2])
        camera_x -= camera_speed;
    if (pressed_keys[3])
        camera_x += camera_speed;
};
setInterval(movement_handler, 1/update_rate);
