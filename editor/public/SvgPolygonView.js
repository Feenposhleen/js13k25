class SvgPolygonView {
  static resolution = 50;

  svgEl = null;
  polysContainerEl = null;
  coordsContainerEl = null;
  polygons = [];
  polygonElMap = new Map();
  selectedPolygon = null;
  onCoordClick = null;
  onPolyClick = null;
  coords = [];
  lastClickedCoord = null;

  constructor({ initialPolygons, onCoordClick, onPolyClick }) {
    this.polygons = initialPolygons;
    this.svgEl = document.querySelector('svg');
    this.polysContainerEl = document.querySelector('#polys');
    this.coordsContainerEl = document.querySelector('#coords');
    this.onCoordClick = onCoordClick;
    this.onPolyClick = onPolyClick;

    this.createCoords();
    this.updatePolygons(this.polygons);
  }

  createCoords() {
    this.coords = [];

    for (var y = 0; y < SvgPolygonView.resolution; y++) {
      var row = [];
      this.coords.push(row);
      for (var x = 0; x < SvgPolygonView.resolution; x++) {
        const coordEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        coordEl.coord = [x, y];
        row.push(coordEl);

        coordEl.classList.add('coord');
        coordEl.setAttribute('r', 0.5);
        coordEl.setAttribute('cx', x * 10);
        coordEl.setAttribute('cy', y * 10);

        if (x === (SvgPolygonView.resolution / 2) && y === SvgPolygonView.resolution / 2) {
          coordEl.classList.add('center');
        }

        const fx = x, fy = y;
        coordEl.addEventListener('click', () => this.onCoordClick([fx, fy], this.selectedPolygon));
        coordEl.addEventListener('mouseover', () => this.onCoordHover([fx, fy], coordEl, true));
        coordEl.addEventListener('mouseout', () => this.onCoordHover([fx, fy], coordEl, false));

        this.coordsContainerEl.appendChild(coordEl);
      }
    }

    this.svgEl.attributes['viewBox'].value = `-10 -10 ${SvgPolygonView.resolution * 10 + 20} ${SvgPolygonView.resolution * 10 + 20}`;
  };

  onCoordHover(coords, el, isHovering) {
    var coord = this.coords[coords[1]][coords[0]];
    coord.classList.toggle('over', isHovering);
  }

  selectPolygon(polygon) {
    if (this.selectedPolygon) {
      this.polygonElMap.get(this.selectedPolygon).classList.remove('selected');
    }

    if (polygon) {
      this.selectedPolygon = polygon;
      this.polygonElMap.get(this.selectedPolygon).classList.add('selected');
    }

    this.updatePolygons(this.polygons);
  }

  updatePolygons(newPolygons = null) {
    if (newPolygons !== null) {
      this.polygonElMap.keys().forEach((poly) => {
        this.polygonElMap.get(poly).remove();
        this.polygonElMap.delete(poly);
      });

      this.polygons = newPolygons;
      this.selectedPolygon = this.polygons.includes(this.selectedPolygon) ? this.selectedPolygon : null;
    }

    this.polygons.forEach((poly) => {
      this.polygonElMap.get(poly)?.remove();
      const el = this.renderPolygon(poly);
      this.polygonElMap.set(poly, el);
    });
  }

  highlightPolygonCoords(polygon) {
    this.coords.forEach((row) => {
      row.forEach((coordEl) => {
        coordEl.classList.remove('active');
      });
    });

    for (let i = 0; i < polygon.points.length; i += 2) {
      const x = polygon.points[i];
      const y = polygon.points[i + 1];
      const coordEl = this.coords[y][x];
      coordEl.classList.add('active');
    }
  }

  renderPolygon(polygon) {
    const pointString = polygon.points.reduce((res, curr, idx) => (res + (curr * 10) + ((idx % 2 ? ', ' : ' '))), '').slice(0, -2);

    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    el.classList.add('poly');

    if (polygon == this.selectedPolygon) {
      el.classList.add('active');
      this.highlightPolygonCoords(polygon);
    }

    el.setAttribute('points', pointString);
    el.setAttribute('fill', polygon.color);

    el.addEventListener('click', () => {
      this.onPolyClick(polygon);
    });

    this.polysContainerEl.appendChild(el);

    return el;
  }
}
