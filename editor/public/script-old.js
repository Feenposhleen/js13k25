(() => {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svgRoot = document.querySelector('#svg');
  const polyRoot = document.querySelector('#polys');
  const coordRoot = document.querySelector('#coords');
  const colorElements = [];

  const ADD = 'add', REMOVE = 'remove', NEW = 'new', MOVE = 'move';
  const SIZE = 50;

  const coords = [];
  const polys = [];

  let mode = NEW;
  let palette = [];
  let drawablesJson;
  let selectedSpriteName;
  let selectedPoly;
  let selectedCoord;
  let selectedColor;

  const encodePolys = () => polys
    .filter(x => x.points.length > 4)
    .reduce((res, curr) => [
      ...res,
      [
        drawablesJson._palette.indexOf(curr.color),
        0,
        ...(curr.points).map((x) => (x / SIZE))
      ],
    ], []);

  const decodePolys = (polyDataList) => {
    polys.length = 0;

    let poly;
    polyDataList.forEach((polyData) => {
      polyData.forEach((value, idx) => {
        if (idx === 0) {
          poly = createPoly();
          poly.color = drawablesJson._palette[value];
        } else if (idx === 1) {
        } else {
          poly.points.push(value * SIZE);
        }
      });
    });

    polys.forEach(applyPoly);
  };

  const createColors = () => {
    const colorRoot = document.querySelector('#colors');
    [...colorRoot.children].forEach(el => el.remove());

    for (let color of drawablesJson._palette) {
      const el = document.createElement('div');
      el.classList.add('color');
      el.style.backgroundColor = color;
      el.addEventListener('click', () => selectColor(color));
      colorRoot.appendChild(el);
    }

    colorElements.length = 0;
    for (let el of colorRoot.children) {
      colorElements.push(el);
    }

    selectColor(drawablesJson._palette);
  }

  const selectColor = color => {
    if (color === selectedColor) return;

    selectedColor = color;

    colorElements.forEach((el, idx) => {
      el.classList.remove('selected');
      if (drawablesJson._palette[idx] === color) {
        el.classList.add('selected');
      }
    });

    if (selectedPoly) {
      selectedPoly.color = color;
      applyPoly(selectedPoly);
    }
  }

  const sameCoord = (coord1, coord2) => coord1[0] === coord2[0] && coord1[1] === coord2[1];

  const setMode = newMode => {
    coordRoot.classList.remove(ADD);
    coordRoot.classList.remove(REMOVE);
    coordRoot.classList.remove(MOVE);
    coordRoot.classList.remove(NEW);

    for (let mode of [ADD, REMOVE, NEW, MOVE]) {
      if (mode === newMode) {
        document.querySelector(`#mode-${mode}`).classList.add('active');
      } else {
        document.querySelector(`#mode-${mode}`).classList.remove('active');
      }
    }

    if (newMode === NEW) selectPoly();
    coordRoot.classList.add(newMode);
    mode = newMode;
  };

  const applyPoly = poly => {
    const pointString = poly.points.reduce((res, curr, idx) =>
      (res + (curr * 10) + ((idx % 2 ? ', ' : ' '))), '')
      .slice(0, -2);

    poly.el.setAttribute('points', pointString);
    poly.el.setAttribute('fill', poly.color);
    updateCoords();
  };

  const movePolyZ = (direction) => () => {
    if (!selectedPoly) return;

    if (direction === -1) {
      var sibling = selectedPoly.el.previousElementSibling;
      if (!sibling) return;

      polyRoot.removeChild(selectedPoly.el);
      polyRoot.insertBefore(selectedPoly.el, sibling);
    } else {
      var sibling = selectedPoly.el.nextElementSibling;
      var nextSibling = sibling ? sibling.nextElementSibling : null;

      polyRoot.removeChild(selectedPoly.el);
      if (nextSibling) {
        polyRoot.insertBefore(selectedPoly.el, nextSibling);
      } else {
        polyRoot.appendChild(selectedPoly.el);
      }
    }

    let idx = polys.indexOf(selectedPoly);
    polys.splice(idx, 1);
    polys.splice(idx + direction, 0, selectedPoly);
  };

  const createCoords = () => {
    for (var y = 0; y < SIZE + 1; y++) {
      for (var x = 0; x < SIZE + 1; x++) {
        const el = document.createElementNS(svgNs, 'circle');
        el.coord = [x, y];
        coords.push(el);

        el.classList.add('coord');
        el.setAttribute('r', 0.5);
        el.setAttribute('cx', x * 10);
        el.setAttribute('cy', y * 10);

        if (x === (SIZE / 2) && y === SIZE / 2) {
          el.classList.add('center');
        }

        const fx = x, fy = y;
        el.addEventListener('click', coordClickCallback([fx, fy]));
        el.addEventListener('mouseover', coordHoverCallback([fx, fy], el, true));
        el.addEventListener('mouseout', coordHoverCallback([fx, fy], el, false));

        coordRoot.appendChild(el);
      }
    }

    svgRoot.attributes['viewBox'].value = `-10 -10 ${SIZE * 10 + 20} ${SIZE * 10 + 20}`;
  };

  const updateCoords = () => {
    coords.forEach(el => {
      el.classList.remove('active')
      el.classList.remove('selected')
    });

    coords.forEach(el => {
      if (selectedPoly) {
        if (selectedCoord && sameCoord(selectedCoord, el.coord)) {
          el.classList.add('selected');
        } else if (pointIndex(selectedPoly, el.coord) !== undefined) {
          el.classList.add('active');
        }
      }
    });
  }

  const pointIndex = (poly, coord) => {
    for (let i = 0; i < poly.points.length; i += 2) {
      if (poly.points[i] === coord[0] && poly.points[i + 1] === coord[1]) {
        return i;
      }
    }
  };

  const containsPoint = (poly, coord) =>
    pointIndex(poly, coord) !== undefined;

  const removePoint = (poly, coord) => {
    const targetIdx = pointIndex(poly, coord);
    poly.points.splice(targetIdx, 2);
    applyPoly(poly);
  };

  const movePoint = (poly, fromCoord, toCoord) => {
    const targetIdx = pointIndex(poly, fromCoord);
    poly.points.splice(targetIdx, 2, ...toCoord);
    applyPoly(poly);
  };

  const addPoint = (poly, coord) => {
    let idx = (selectedCoord) ? pointIndex(poly, selectedCoord) + 2 : 999;
    poly.points.splice(idx, 0, ...coord);
    applyPoly(poly);
  };

  const coordClickCallback = (coord) => ev => {
    console.log('Clicked coord', coord);

    if (mode === NEW) {
      const poly = createPoly();
      selectPoly(poly);
      addPoint(poly, coord);
      selectCoord(coord);
      setMode(ADD);

    } else if (mode === ADD) {
      if (!selectedPoly) return;

      if (containsPoint(selectedPoly, coord)) {
        selectCoord(coord);
        updateCoords();
      } else {
        addPoint(selectedPoly, coord);
        selectCoord(coord);
      }
    } else if (mode === REMOVE) {
      if (!selectedPoly) return;

      if (containsPoint(selectedPoly, coord)) {
        removePoint(selectedPoly, coord);
        selectCoord();
      }
    } else if (mode === MOVE) {
      if (!selectedPoly) return;

      if (containsPoint(selectedPoly, coord)) {
        selectCoord(coord);
      } else if (selectedCoord) {
        movePoint(selectedPoly, selectedCoord, coord);
        selectCoord(coord);
      }
    }

    ev.stopPropagation();
    ev.preventDefault();
  };

  const coordHoverCallback = (coord, el, over) => ev => {
    if (over) {
      el.classList.add('over');
    } else {
      el.classList.remove('over');
    }
  }

  const selectPoly = poly => {
    if (poly === selectedPoly) return;

    polys.forEach(poly => poly.el.classList.remove('selected'));

    if (poly) {
      poly.el.classList.add('selected');
    }

    selectedPoly = poly;
    selectCoord();
    updateCoords();
  };

  const selectCoord = coord => {
    selectedCoord = coord;
    updateCoords();
  };

  const createPoly = () => {
    const el = document.createElementNS(svgNs, 'polygon');
    el.classList.add('poly');
    polyRoot.appendChild(el);

    const poly = {
      points: [],
      color: selectedColor || palette[0],
      el: el,
    };

    el.addEventListener('click', ev => {
      console.log('Clicked poly');
      selectPoly(poly);

      ev.preventDefault();
      ev.stopPropagation();
    });

    polys.push(poly);
    updateCoords();
    return poly;
  };

  const loadSprite = spriteName => {
    for (let key of Object.keys(drawablesJson._textureNameMap)) {
      if (key === spriteName) {
        decodePolys(drawablesJson._textures[drawablesJson._textureNameMap[key]]);
        break;
      }
    }
  }

  const fetchDrawables = async () => {
    drawablesJson = await fetch('/drawables').then(res => res.json());
    createColors();
  }

  const main = async () => {
    await fetchDrawables();
    loadSprite('triangle');

    createCoords();
    createColors();

    for (let mode of [ADD, REMOVE, MOVE, NEW]) {
      let m = mode;
      document.querySelector(`#mode-${m}`).addEventListener('click', () => setMode(m));
    }

    svgRoot.addEventListener('click', () => {
      console.log('Clicked svg');
      selectPoly();
    });

    setMode(NEW);

    document.querySelector('#action-import').addEventListener('click', async () => {
      if (polys.length > 0 && !window.confirm('Import and overwrite?')) return;

      var str = await navigator.clipboard.readText();
      var encoded = JSON.parse(str);
      decodePolys(encoded);
    });

    document.querySelector('#action-export').addEventListener('click', async () => {
      var raw = encodePolys();
      await navigator.clipboard.writeText(
        JSON.stringify(raw)
          .replaceAll(',"', ',\n\t"')
          .replaceAll('[', '[\n\t')
          .replaceAll(']', '\n]')
      );

      window.alert('Copied to clipboard!');
    });

    document.querySelector('#action-moveup').addEventListener('click', movePolyZ(1));

    document.querySelector('#action-movedown').addEventListener('click', movePolyZ(-1));
  }

  main();
})()