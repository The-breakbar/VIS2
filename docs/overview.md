## Overview

The project is a static html page, made with d3.js, webpack and typescript. Webpack is configured to compile everything to a self-contained project.

## Files

The project contains the following folders:

-   `.github`: Automatic github deployment action workflow
-   `.vscode`: Default template for launch configuration
-   `data`: Contains the data for the project
-   `dist`: Generated build files
-   `docs`: Contains the documentation
-   `src`: Contains the source code

## Source Code

The main entry point is `src/index.ts`. The general program flow is reading in the data, processing it and rendering it to the html, which are contained in subfolders.

### dimensionality

The dimensionality folder includes the uses of Non-negative Matrix Factorization (NMF) and t-Distributed Stochastic Neighbor Embedding (TSNE) algorithms. These methods are used for reducing the dimensions of the data, as referenced in the associated paper.

### space_tesselation

See [Space Tesselation](space_tesselation.md).

### visualization

The main draw loop is found in `draw.js`, where the voronoi cells are processed and drawn with d3.js. That file also handles everything related to the d3.js svg elements. To properly visualize the coordinates, `coordsProjection.ts` contains methods to convert from longitude and latitude to x and y coordinates. The visual interface and their callbacks are in `ui.ts`.
