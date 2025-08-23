(() => {
  const refreshData = async () => {
    const response = await fetch('/drawables');
    const data = await response.json();

    const editorData = new EditorData(data);
    load(editorData);
  }

  const saveData = async (editorData) => {
    await fetch('/drawables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editorData.serialize()),
    });

    refreshData();
  }

  const load = (editorData) => {
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
          saveData(editorData);
        }
        if (action === EditorAction.RELOAD) {
          refreshData();
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
  }

  refreshData();
})();