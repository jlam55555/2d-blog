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

// documents in view; updated whenever you move/scale/resize, etc.
let docs_in_view = new Set();
// how far from the edge of the screen in doc coordinates to still consider it
// (in pixels)
const doc_boundary_threshold = Math.max(width, height) / 2;
const update_docs_in_view = () => {
    for (var i = 0; i < doc_coords.length; ++i) {
        const [screen_x, screen_y] = dc2sc(...doc_coords[i]);
        if (screen_x > -doc_boundary_threshold
            && screen_x < width + doc_boundary_threshold
            && screen_y > -doc_boundary_threshold
            && screen_y < height + doc_boundary_threshold) {
            docs_in_view.add(i);
        } else {
            docs_in_view.delete(i);
        }
    }
};
update_docs_in_view();

// for negative modulus
// see: https://stackoverflow.com/a/17323608/2397327
const mod = (n, m) => ((n % m) + m) % m;

// necessary for drawing, calculated on mouse move or any resize events
let hovered_document = -1;

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
    for (const doc_index of docs_in_view) {
        // translate document coordinates to screen coordinates
        const [screen_x, screen_y] = dc2sc(...doc_coords[doc_index]);
        if (doc_index === hovered_document) {
            ctx.fillStyle = "#ff8888";
            ctx.beginPath();
            ctx.ellipse(screen_x, screen_y, 14.14, 14.14, 0, 0, 2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "black";
        }

        ctx.fillRect(screen_x-10, screen_y-10, 20, 20);
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
const key_handler = evt => {
    // movement handlers; just update key map
    if (evt.code in key_map) {
        pressed_keys[key_map[evt.code]] = evt.type === 'keyup' ? 0 : 1;
    }
    // when other keys are pressed
    else if (evt.type === 'keydown') {
        if (evt.code === 'KeyQ') {
            scale_slider.value = Math.max(1, parseInt(scale_slider.value) - 1);
            scale_handler();
        } else if (evt.code === 'KeyE') {
            scale_slider.value = Math.min(20, parseInt(scale_slider.value) + 1);
            scale_handler();
        }
    }

    update_docs_in_view();
};
document.addEventListener('keyup', key_handler);
document.addEventListener('keydown', key_handler);

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

// find the closest point, don't need this to update too often
// TODO: can probably move this into a worker
// TODO: can probably refine when this gets called, only needs to get called
//      on certain events
const mouse_threshold = 30;
let mouse_x = -1, mouse_y = -1;
const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
const find_selected_handler = () => {
    let closest = -1,
        closest_distance = Number.MAX_VALUE;

    for (const doc_index of docs_in_view) {
        const [screen_x, screen_y] = dc2sc(...doc_coords[doc_index]);
        const dst = dist(screen_x, screen_y, mouse_x, mouse_y);

        if (dst < closest_distance) {
            closest = doc_index;
            closest_distance = dst;
        }
    }

    if (closest_distance < mouse_threshold) {
        hovered_document = closest;
        cvs.classList.add('select');
    } else {
        hovered_document = -1;
        cvs.classList.remove('select');
    }
};
setInterval(find_selected_handler, 1/60);
window.addEventListener('mousemove', evt => ({clientX: mouse_x, clientY: mouse_y} = evt));
