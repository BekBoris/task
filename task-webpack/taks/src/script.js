import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

(async () => {
    // Debug
    const gui = new dat.GUI()
    gui.open()

    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    /**
     * Camera
     */
        // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
    camera.position.x = 4
    camera.position.y = 2
    camera.position.z = 5
    scene.add(camera)

    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true

    /**
     * Loading Manager
     */

    const loadingManager = new THREE.LoadingManager()
    loadingManager.onStart = () => {
        console.log('loadingManager: loading started')
    }
    loadingManager.onLoad = () => {
        console.log('loadingManager: loading finished')
    }
    loadingManager.onProgress = () => {
        console.log('loadingManager: loading progressing')
    }
    loadingManager.onError = () => {
        console.log('loadingManager: loading error')
    }

    // Texture Loader
    const textureLoader = new THREE.TextureLoader(loadingManager)

    // Loading Texture Data
    const texturesData = {
        map: {url: '/textures/wood-board/wood-board-basecolor.png', texture: null},
        normalMap: {url: '/textures/wood-board/wood-board-normal.png', texture: null},
        metalnessMap: {url: '/textures/wood-board/wood-board-roughness.png', texture: null},
        roughnessMap: {url: '/textures/wood-board/wood-board-roughness.png', texture: null},
        aoMap: {url: '/textures/wood-board/wood-board-ambientOcclusion.png', texture: null},
        displacementMap: {url: '/textures/wood-board/wood-board-height.png', texture: null},
    }

    // Load Texture Async
    async function LoadTexture(url) {
        let result = await textureLoader.loadAsync(url);
        return result
    }

    // Texture Map
    const map = await LoadTexture(texturesData.map.url)
    texturesData.map.texture = map

    // Texture Normal Map
    const normalMap = await LoadTexture(texturesData.normalMap.url)
    texturesData.normalMap.texture = normalMap

    // Texture Metalness Map
    const metalnessMap = await LoadTexture(texturesData.metalnessMap.url)
    texturesData.metalnessMap.texture = metalnessMap

    // Texture Roughness Map
    const roughnessMap = await LoadTexture(texturesData.roughnessMap.url)
    texturesData.roughnessMap.texture = roughnessMap

    // Texture Ambient Occlusion Map
    const aoMap = await LoadTexture(texturesData.aoMap.url)
    texturesData.aoMap.texture = aoMap

    //Texture Height Map
    const displacementMap = await LoadTexture(texturesData.displacementMap.url)
    texturesData.displacementMap.texture = displacementMap

    /**
     * Cube
     */

    // Cube Parent Group
    const cube = new THREE.Group()
    scene.add(cube)

    // Geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1, 100, 100, 100)

    // Material
    const materials = [
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001}),
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001}),
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001}),
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001}),
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001}),
        new THREE.MeshStandardMaterial({side: THREE.DoubleSide, aoMapIntensity: 0.4, displacementScale: 0.001})
    ]

    for (const texturesDataKey in texturesData) {
        materials.forEach((material) => {
            const texture = texturesData[texturesDataKey].texture
            texture.needsUpdate = true;
            texture.repeat.set(1, 1)
            texture.wrapS = THREE.MirroredRepeatWrapping
            texture.wrapT = THREE.MirroredRepeatWrapping
            texture.magFilter = THREE.NearestFilter
            texture.minFilter = THREE.LinearFilter
            material[texturesDataKey] = texture.clone()
            texture.needsUpdate = true;
        })
    }

    const mesh = new THREE.Mesh(geometry, materials)
    cube.add(mesh)
    cube.scale.y = 0.8
    cube.position.y = 0.4

    // Cube Control on X Axis
    const cubeControl = gui.addFolder('Cube')

    let prevScale = 1
    let moveToFront = false
    let moveToLeft = false

    cubeControl.add(cube.scale, 'x').min(1).max(30).name("Width").onChange((val) => {
        const keys = Object.keys(texturesData);
        keys.forEach(key => {
            materials[2][key].repeat.x = val
            materials[3][key].repeat.x = val
            materials[4][key].repeat.x = val
            materials[5][key].repeat.x = val
        })

        if(moveToLeft || moveToFront) return
        const maxSide = getBoundingMaxSize()
        setCameraDistance(maxSide, prevScale)

    })

    // Cube Control on Z Axis
    cubeControl.add(cube.scale, 'z').min(1).max(30).name("Depth").onChange((val) => {
        const keys = Object.keys(texturesData);
        keys.forEach((key) => {
            materials[0][key].repeat.x = val
            materials[1][key].repeat.x = val
            materials[2][key].repeat.y = val
            materials[4][key].repeat.y = val
        })

        if(moveToLeft || moveToFront) return
        const maxSide = getBoundingMaxSize()
        setCameraDistance(maxSide, prevScale)
    })

    const vectorFront = new THREE.Vector3(0, 5,5)
    const moveCameraFront = () => {
        vectorFront.normalize()
        const maxSide = getBoundingMaxSize()
        vectorFront.multiplyScalar(maxSide * 1.3)
        if(moveToLeft) return
        moveToFront = true
    }

    const vectorLeft = new THREE.Vector3(-5, 5,0)
    const moveCameraLeft = () => {
        vectorLeft.normalize()
        const maxSide = getBoundingMaxSize()
        vectorLeft.multiplyScalar(maxSide * 1.5)
        if(moveToFront) return
        moveToLeft = true
    }

    const cameraMovement = { front: moveCameraFront, left: moveCameraLeft}

    const moveCameraControl = gui.addFolder("Move Camera Forward")
    moveCameraControl.open()

    moveCameraControl.add(cameraMovement, 'front').name('Move Front')
    moveCameraControl.add(cameraMovement, 'left').name('Move Left')

    const getBoundingMaxSize = () => {
        const box = new THREE.Box3().setFromObject(cube)
        const vector = new THREE.Vector3()
        box.getSize(vector)
        const maxVal = Math.max(vector.x, vector.y, vector.z)
        return maxVal
    }

    const setCameraDistance = (val, prevScaleAxis) => {
        const currentCameraPosition = new THREE.Vector3
        currentCameraPosition.copy(camera.position)
        currentCameraPosition.y = 0
        currentCameraPosition.normalize()
        camera.position.add(currentCameraPosition.multiplyScalar((val-prevScaleAxis)))
        prevScale = val
    }

    /**
     * Floor
     */

    // Floor greed
    const size = 15;
    const divisions = 15;

    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    // Floor Plane
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({color: 0x000000, side: THREE.DoubleSide})
    )
    floor.rotation.x = -Math.PI * 0.5
    floor.position.y = -0.01
    scene.add(floor)


    /**
     * Lights
     */

    // Ambient Light
    const ambLight = new THREE.AmbientLight('#ffffff', 1)
    scene.add(ambLight)

    // Ambient Light Control
    const ambientLightControl = gui.addFolder('AmbientLight')
    ambientLightControl.open()
    ambientLightControl.add(ambLight, 'intensity').min(0).max(2).step(0.01)

    // Directional light
    const dirLight = new THREE.DirectionalLight('#ffffff', 1)
    dirLight.position.set(4, 5, -2)
    scene.add(dirLight)

    // Directional Light Control
    const directionalLightControl = gui.addFolder('DirectionalLight')
    directionalLightControl.open()
    directionalLightControl.add(dirLight, 'intensity').min(0).max(2).step(0.01)
    directionalLightControl.add(dirLight.position, 'x').min(-15).max(15).step(0.01)
    directionalLightControl.add(dirLight.position, 'y').min(-15).max(15).step(0.01)
    directionalLightControl.add(dirLight.position, 'z').min(-15).max(15).step(0.01)

    /**
     * Resize Event Listener
     */
    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    /**
     * Renderer
     */

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    /**
     * Animate
     */
    const clock = new THREE.Clock()
    let prevTime = 0

    const tick = () => {

        const elapsedTime = clock.getElapsedTime()
        const delta = elapsedTime - prevTime
        prevTime = elapsedTime

        if(moveToFront && !moveToLeft){
            controls.object.position.lerp(vectorFront, delta)
            if(vectorFront.distanceTo(controls.object.position) < 0.09){
                moveToFront = false
            }
        }

        if(moveToLeft && !moveToFront){
            controls.object.position.lerp(vectorLeft, delta)
            if(vectorLeft.distanceTo(controls.object.position) < 0.09){
                moveToLeft = false
            }
        }

        // Update controls
        controls.update()

        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }

    tick()

})()