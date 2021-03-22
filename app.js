const createCurvedLines = (vectors, scene, name, points = 20) => {
    const catmullRomSpline = BABYLON.Curve3.CreateCatmullRomSpline(vectors, points, false);
    const curvedLine = BABYLON.Mesh.CreateLines(name, catmullRomSpline.getPoints(), scene);
    curvedLine.color = new BABYLON.Color3(1, 0, 1);
    return catmullRomSpline;
}

const randomPointsGenerator = (points, groundWidth, groundHeight) => {
    const groundSectionSubdiv = Math.floor(groundHeight / points);
    let groundSectionBot = (-1 * groundHeight / 2) + 1,
        groundSectionTop = groundSectionBot + groundSectionSubdiv;
    const vectors = [new BABYLON.Vector3(0, 0, groundSectionBot)];
    for (let i = 0; i < points - 1; i++) {
        let z;
        let x = getRandomPoint(-1 * groundWidth / 2, groundWidth / 2);
        if (i === 0) {
            z = getRandomPoint(groundSectionBot + 150, groundSectionTop);
        } else {
            z = getRandomPoint(groundSectionBot + 50, groundSectionTop - 50);
        }

        let newRandomVector = new BABYLON.Vector3(x, 0, z);
        
        vectors.push(newRandomVector);
        groundSectionBot += groundSectionSubdiv;
        groundSectionTop += groundSectionSubdiv;
    }
    vectors.push(new BABYLON.Vector3(0, 0, groundHeight / 2));
    return vectors;
}

const createPath = (catmull, shiftedCatmull, scene) => {
    let mat = new BABYLON.StandardMaterial("mat1", scene);
    mat.alpha = 1.0;
    mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
    mat.backFaceCulling = false;

    const ribbon = new BABYLON.MeshBuilder.CreateRibbon('ribbon', {
        pathArray: [catmull.getPoints(), shiftedCatmull.getPoints()]
    }, scene);
    ribbon.material = mat;
    ribbon.position.y = 1;

    return ribbon;
}

const createPaths = (number, scene, options) => {
    if (!options) {
        const options = {
            points: 20,
            groundWidth: 400,
            groundHeight: 2000,
            shift: 15,
            catmullPoints: 20
        }
    }
    const paths = [];
    for (let i = 0; i < number; i++) {
        let vectors = randomPointsGenerator(options.points, options.groundWidth, options.groundHeight);
        vectors.forEach((vector,index) => {
            let point = BABYLON.MeshBuilder.CreateBox('point_' + index, {size: 5}, scene);
            let material = new BABYLON.StandardMaterial('material_' + index, scene);

            material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            point.material = material;
            point.position = vector;
        })
        let curvedLine1 = createCurvedLines(vectors, scene, 'catmul1', options.catmullPoints);
        let curvedLine2 = createCurvedLines(vectors, scene, 'catmul2', options.catmullPoints);
        shiftCatmull(curvedLine2, 10, scene);
        let pathOutline = createPath(curvedLine1, curvedLine2, scene);

        paths.push(pathOutline);
    }

    return paths;
}

const shiftCatmull = (catmull, shift) => {
    const catmullPoints = catmull.getPoints();
    let diffX, diffZ;
    for (let i = 0; i < catmullPoints.length; i++) {
        catmullPoints[i].x += shift;
        if (i > 0) {
            diffX = catmullPoints[i].x - catmullPoints[i - 1].x;
            diffZ = catmullPoints[i].z - catmullPoints[i - 1].z;

            if (diffX > 0 && diffZ < 0) {
                catmullPoints[i].z -= shift/5;
            } 
            if (diffX < 0 && diffZ < 0) {
                catmullPoints[i].z += shift/5;
            }

            if (diffX > 0 && diffZ > 0) {
                catmullPoints[i].z -= shift/5;
            } 
            if (diffX < 0 && diffZ > 0) {
                catmullPoints[i].z += shift/5;
            }
        }


    }
}

const shiftLine = (vectors, shift) => {
    const copyOfVectors = []

    for (let i = 0; i < vectors.length; i++) {
        let shiftedVector = new BABYLON.Vector3(
            vectors[i].x + shift,
            vectors[i].y,
            vectors[i].z
        );
        copyOfVectors.push(shiftedVector);
    }

    return copyOfVectors;
}

const getRandomPoint = (min, max) => {
    return Math.random() * (max - min) + min;
}

const createGround = (width, height) => {
    const ground = new BABYLON.MeshBuilder.CreateGround('ground', {
        width: width,
        height: height
    });
    return ground;
}

const createScene = (engine, canvas) => {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1000, new BABYLON.Vector3(0, 0, -500), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const ground = createGround(400, 2000);

    const paths = createPaths(1, scene, {
        points: 15,
        groundWidth: 400,
        groundHeight: 2000,
        shift: 10,
        catmullPoints: 100
    });

    return scene;
}

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

const scene = createScene(engine, canvas);

engine.runRenderLoop(() => {
    scene.render();
})