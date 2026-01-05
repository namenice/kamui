// src/routes/v1/index.js
const express = require('express');
const healthRoute = require('./health.route');
const config = require('../../config/config');
const userRoute = require('./user.route');
const authRoute = require('./auth.route');
const regionRoute = require('./region.route');
const zoneRoute = require('./zone.route');
const siteRoute = require('./site.route');
const roomRoute = require('./room.route');
const rackRoute = require('./rack.route');
const tenantGroupRoute = require('./tenantGroup.route');
const tenantRoute = require('./tenant.route');
const hardwareTypeRoute = require('./hardwareType.route');
const hardwareInfoRoute = require('./hardwareInfo.route');
const hardwareRoute = require('./hardware.route');
const interfaceConnectionRoute = require('./interfaceConnection.route');


const docsRoute = require('./docs.route');

const router = express.Router();

// Add Route
// router.use('/health', healthRoute);
// router.use('/users', userRoute);
// router.use('/auth', authRoute); 
const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/regions',
    route: regionRoute,
  },
  {
    path: '/zones',
    route: zoneRoute,
  },
  {
    path: '/sites',
    route: siteRoute,
  },
  {
    path: '/rooms',
    route: roomRoute,
  },
  {
    path: '/racks',
    route: rackRoute,
  },
  {
    path: '/tenant-groups',
    route: tenantGroupRoute,
  },
  {
    path: '/tenants',
    route: tenantRoute,
  },
  {
    path: '/hardware-infos',
    route: hardwareInfoRoute,
  },
  {
    path: '/hardware-types',
    route: hardwareTypeRoute,
  },
  {
    path: '/hardwares',
    route: hardwareRoute,
  },
  {
    path: '/interface-connections',
    route: interfaceConnectionRoute,
  },

// ----------
  {
    path: '/health',
    route: healthRoute,
  },
  {
    path: '/docs',
    route: docsRoute,
  },
];

// const devRoutes = [
//   {
//     path: '/docs',
//     route: docsRoute,
//   },
// ];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// ตรวจสอบว่าเป็น Development หรือไม่
// if (config.env === 'development') {
//   devRoutes.forEach((route) => {
//     router.use(route.path, route.route);
//   });
// }

module.exports = router;