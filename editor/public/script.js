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

  const editorData = new EditorData(testData);

  const polygonView = new SvgPolygonView({
    initialPolygons: editorData.getTexture('triangle').polygons,
    onCoordClick: (coords, selectedPolygon) => {
      console.log(`Coordinate clicked: ${coords}, selectedPolygon: ${selectedPolygon}`);

      switch (editorUi.selectedMode) {
        case EditorMode.ADD: {
          if (selectedPolygon) {
            const closeIndex = selectedPolygon.closestIndex(coords);
            selectedPolygon.insertPoint(closeIndex, coords);
            polygonView.updatePolygons();
          } else {
            const polygon = new Polygon(coords, editorUi.selectedColor, 0);
            editorUi.selectedTexture.addPolygon(polygon);
            polygonView.updatePolygons(editorUi.selectedTexture.polygons);
            polygonView.selectPolygon(polygon);
          }
          break;
        }
        case EditorMode.DELETE: {
          if (!selectedPolygon) return;
          if (selectedPolygon.points.length > 3) {
            const pointIndex = selectedPolygon.pointIndex(coords);
            if (pointIndex !== -1) {
              selectedPolygon.removePoint(pointIndex);
              polygonView.updatePolygons();
            }
          } else {
            // Remove entire polygon
            const texture = editorUi.selectedTexture;
            texture.removePolygon(selectedPolygon);
            polygonView.updatePolygons(texture.polygons);
            editorUi.onEditorDataUpdated();
          }
          break;
        }
        case EditorMode.MOVE: {
          if (!selectedPolygon) return;

          if (editorUi.pendingMoveCoord) {
            const potentialIndex = selectedPolygon.pointIndex(editorUi.pendingMoveCoord);
            if (potentialIndex === -1) break;

            selectedPolygon.setPoint(potentialIndex, coords);
            polygonView.updatePolygons();
            editorUi.pendingMoveCoord = null;
          } else {
            const potentialIndex = selectedPolygon.pointIndex(coords);
            if (potentialIndex === -1) break;
            editorUi.pendingMoveCoord = coords;
          }
          break;
        }
        case EditorMode.NEW: {
          const polygon = new Polygon([coords], editorUi.selectedColor, 0);
          editorData.selectedTexture.addPolygon(polygon);
          polygonView.updatePolygons(editorUi.selectedTexture.polygons);
          polygonView.selectPolygon(polygon);
          break;
        }
      }
    },
    onPolyClick: (poly) => {
      polygonView.selectPolygon(poly);
      editorUi.pendingMoveCoord = null;
    },
  });

  const editorUi = new EditorUI({
    editorData,
    onAction: (action) => {
      console.log(`Action: ${action}`);
      if (action === EditorAction.SAVE) {
        const serialized = JSON.stringify(editorData.serialize());
        console.log(serialized);
      }
    },
    onModeSelected: (mode) => {
      console.log(`Mode selected: ${mode}`);
      editorUi.pendingMoveCoord = null;
    },
    onColorSelected: (color) => {
      console.log(`Color selected: ${color}`);
      if (polygonView.selectedPolygon) {
        polygonView.selectedPolygon.color = color;
      }
      polygonView.updatePolygons(editorUi.selectedTexture.polygons);
    },
    onTextureSelected: (texture) => {
      console.log(`Texture selected: ${texture.name}`);
      polygonView.updatePolygons(editorUi.selectedTexture.polygons);
    },
    onEditorDataUpdated: () => {
      console.log('Editor data updated');
      polygonView.updatePolygons(editorUi.selectedTexture.polygons);
    },
  });
})();