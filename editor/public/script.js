(() => {
  const svgElement = document.querySelector('svg');

  const testData = {
    "_palette": [
      "#507180",
      "#3a4a55"
    ],
    "_textures": {
      "triangle": [
        [
          0, 0, 0.16, 0.8, 0.36, 0.5, 0.72, 0.46, 0.66, 0.32, 0.32, 0.26, 0.14, 0.36, 0.06, 0.54
        ], [
          1, 0, 0.16, 0.8, 0.4, 0.8, 0.62, 0.7, 0.74, 0.54, 0.72, 0.46, 0.6, 0.46, 0.44, 0.46, 0.32, 0.5, 0.18, 0.62
        ], [
          1, 0, 0.44, 0.26, 0.5, 0.36, 0.66, 0.42, 0.8, 0.34, 0.8, 0.18, 0.68, 0.26, 0.56, 0.28
        ], [
          0, 0, 0.44, 0.26, 0.5, 0.12, 0.64, 0.08, 0.78, 0.12, 0.8, 0.18, 0.68, 0.28, 0.58, 0.3
        ]
      ]
    }
  };

  const onCoordClick = (coords, selectedPolygon) => {
    console.log(`Coordinate clicked: ${coords}, selectedPolygon: ${selectedPolygon}`);

    if (selectedPolygon) {
      const closeIndex = selectedPolygon.closestIndex(coords);
      selectedPolygon.insertPoint(closeIndex, coords);
      polygonView.updatePolygons();
    }
  };

  const onPolyClick = (poly) => {
    polygonView.selectPolygon(poly);
  };

  const textureManager = new TextureManager();
  textureManager.loadSerialized(testData);

  const polygonView = new SvgPolygonView({
    initialPolygons: textureManager.getTexture('triangle').polygons,
    onCoordClick,
    onPolyClick,
  });
})();