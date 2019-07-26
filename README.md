# The Map Spot

To document and reflect upon the connections and disjunctions between civic data and lived experience, through the collaborative creation of large-scale, interpretive maps.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Installing

After cloning the repository, ensure that node and npm are installed on your machine. Change directory into the main folder and run command `npm install` to install dependencies.

### Starting the Server

Navigate to the main directory and then move down one level to the /src folder. Run `node main.js` to start the server, which will listen on the port specified within the files (by default, port 8080).

Once the server is running, you should be able to navigate to the page in a web browser (http://localhost:8080) in order to view the index.html page, which shows links to the Controller, Projector, and Table pages. These three pages can be opened as separate tabs or windows in order to test the system.

#### Testing
With all of the pages open in a browser, basic functionality testing should include the following:
1. Updating the map position on the Controller by dragging should update the map view on the Projector
2. Toggling a layer on the Controller should cause the corresponding layer to be shown or hidden from the Projector
3. Enabling the Tax Assessment layer and zooming in to a smaller region should cause property entries to appear on the Table page
4. Selecting an entry on the Table page should highlight the property in yellow and display detailed information on the Projector
5. (with **sensor_server** running) Moving the projector should smoothly pan the Projector view along the rectangle guide.



## Built With

* [MapBox GL](https://www.mapbox.com/mapbox-gl-js/api/) - Open-source libraries for embedding maps
* [Node.js](https://nodejs.org/en/) - JavaScript runtime

## Authors
* **Raya Ward** - *Map Spot* - [rayaward](https://github.com/rayaward)

* **Muniba M. Khan** - *Initial work* - [kmuniba98](https://github.com/kmuniba98)
* **Christopher Polack** - *Initial work* - [cfpolack](https://github.com/cfpolack)
* **Annabel Rothschild** - *Initial work* - [annabelrothschild](https://github.com/annabelrothschild)

See also the list of [contributors](https://github.com/kmuniba98/Atlanta-Map-Room/contributors) who participated in this project.

## Acknowledgments

* Dr. Ellen Zegura, Dr. Chris Le Dantec, Dr. Amanda Meng, Dr. Alex Godwin, Francella Tonge and the Civic Data Science REU
* Jer Thorp, Emily Catedral, and the Office for Creative Research and St. Louis Center for Creative Arts
* Melanie Richard and the support staff of the School of Literature, Media, and Communication
* Digital Integrative Liberal Arts Center at the Georgia Institute of Technology Ivan Allen College of Liberal Arts
