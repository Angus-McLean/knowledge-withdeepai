
# Get Started With Knowledge.WithDeep.ai
Interactively navigate the world of human knowledge

# Todos
- Improve - New Nodes
    - Run Layout only against new nodes
        - First run with very small edge length
        - Wait layout-finish (with promise) then(run regular layout against nodes)
- Refactor & Clean

# Feature Ideas!
- Dragged nodes
    - Run layout against children
- Node Selection & Styles
- Context Menu
- Keep special characters
    - Add a json field for 'full-name' or something
- Change paths to use '/' seperator
- Don't lock nodes...
- Status of each node (loaded, loading, leaf/queued, tbd)
    - Little notification when new nodes are fetched etc
- Click for force fetch subtopics
    - Sometimes zooming doesn't work??
- Keyboard to pan
- Search
    - Keyword
    - Proximity (embedding)
- Interactive Infos
    - Use chatGPT3 for quick summaries / description?
    - Or "Activities" / "How to conduct this work" / "How to get started"
    - Select Multiple Items
        - How are they related?
- Better Batched Searching
    - Daily cron - to fire up and run a search
- Crowd-Source
    - People can run locally
    - Contribute an API token
    - Add Notes, Relevant Links
    - Suggest Nodes & Edges
- Sidebar
    - Details from Selected Nodes

# DONE
- Fix Node IDs - Uses path
- Dynamically add nodes
    - Better functions
    - handle freeze & add
- Auto query new topics
    - find leaf nodes, query, add infos
- Better query
    - Drop descriptions?
    - multi-depth queries (names only)
- Better knowledge-tree structure
    - files with folders
    - subtopics is obj not array
- Create a sample JSON document
    - Feed into Cyto
- Smoothly adjust opacity
- Create notebook
    - Collect tree structure








----
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
