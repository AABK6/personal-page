# Camera and Zoom Controls Explained

This document provides a detailed breakdown of the parameters used to configure camera movements and zoom in the Three.js application.

## 1. Main Camera (`THREE.PerspectiveCamera`)

This is the primary camera used in the scene. It's initialized with the following parameters:

```javascript
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;
```

-   **`75` (Field of View - FOV):** This is the first argument. It determines the extent of the scene that is seen on the display at any given moment. The value is in vertical degrees. A value of `75` provides a wide-angle view, which is common for immersive 3D scenes.
-   **`window.innerWidth / window.innerHeight` (Aspect Ratio):** This is the second argument. It should almost always be set to the width of the element divided by its height to prevent the scene from looking stretched or squashed.
-   **`0.1` (Near Clipping Plane):** The third argument. Any objects closer to the camera than this value will not be rendered. It's set to a small value to allow the camera to get very close to objects without them disappearing.
-   **`1000` (Far Clipping Plane):** The fourth argument. Any objects further from the camera than this value will not be rendered. This helps with performance by not rendering objects that are too far away to be seen clearly.
-   **`camera.position.z = 30;`**: This line sets the initial distance of the camera from the origin (0, 0, 0) along the Z-axis. This is the starting zoom level before any user interaction.

## 2. Interactive Controls (`OrbitControls`)

This script uses `OrbitControls` to allow the user to rotate the camera around the scene's center by clicking and dragging.

```javascript
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 30;
```

-   **`controls.enableDamping = true;`**: This creates a smooth, inertial effect after the user stops dragging. Instead of stopping abruptly, the camera will continue to move for a moment and gradually slow down. This requires calling `controls.update()` in the animation loop.
-   **`controls.dampingFactor = 0.05;`**: This value controls the speed of the damping effect. A smaller value results in a longer "coast" time after the user releases the mouse.
-   **`controls.enablePan = false;`**: This disables the ability to "pan" the camera (move it side-to-side or up-and-down). In this configuration, the user can only rotate the camera, not change its position in the XY plane.
-   **`controls.minDistance = 3;`**: This sets the minimum distance the camera can be from the center of the scene when zooming *using the OrbitControls built-in zoom (middle mouse wheel)*. It prevents the user from zooming inside the particle system.
-   **`controls.maxDistance = 30;`**: This sets the maximum distance the camera can be from the center of the scene. It prevents the user from zooming too far out.

## 3. Scroll-Based Zoom (Custom Implementation)

The primary zoom mechanism is tied to the user scrolling the page, implemented in the `onWheel` function. This overrides the default `OrbitControls` zoom.

```javascript
function onWheel(event) {
    // ...
    const scrollY = scrollContainer.scrollTop;
    const maxZoom = 10; // Minimum zoom level (closest)
    const minZoom = 30; // Maximum zoom level (farthest)

    // Camera zoom effect
    const zoom = minZoom - (scrollY / 100);
    camera.position.z = Math.max(zoom, maxZoom); // Clamp zoom
    // ...
}
```

-   **`maxZoom = 10;`**: This constant defines the *closest* the camera can get to the scene's origin (a `z` position of 10).
-   **`minZoom = 30;`**: This constant defines the *farthest* the camera can be from the scene's origin (the initial `z` position of 30).
-   **`const zoom = minZoom - (scrollY / 100);`**: This is the core formula for the scroll-based zoom.
    -   It starts with the `minZoom` value (30).
    -   As the user scrolls down (`scrollY` increases), the value of `scrollY / 100` gets larger.
    -   This increasing value is subtracted from `minZoom`, causing the camera's `z` position to decrease, which moves it closer to the scene (zooming in).
    -   The division by `100` controls the sensitivity of the zoom. A smaller number (e.g., `50`) would make the zoom faster, while a larger number (e.g., `200`) would make it slower.
-   **`camera.position.z = Math.max(zoom, maxZoom);`**: This line applies the calculated `zoom` value to the camera's `z` position. It uses `Math.max` to "clamp" the value, ensuring that the camera's position never goes below `maxZoom` (10), preventing the user from zooming in too far.

The same logic is replicated in the `touchmove` event listener to ensure a consistent zoom experience on mobile devices.
