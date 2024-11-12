export default {
  path: __dirname + "/../",
  title: "Foo", // use info instead
  version: "1.0.0", // use info instead
  description: "", // use info instead
  tagIndex: 2,
  info: {
    title: "Harmoniq API",
    version: "1.0.0",
    description: "Label distribution API",
  },
  snakeCase: true,

  debug: false, // set to true, to get some useful debug output
  ignore: ["/swagger", "/docs"],
  preferredPutPatch: "PUT", // if PUT/PATCH are provided for the same route, prefer PUT
  common: {
    parameters: {}, // OpenAPI conform parameters that are commonly used
    headers: {}, // OpenAPI conform headers that are commonly used
  },
  securitySchemes: {}, // optional
  authMiddlewares: ["auth", "auth:api"], // optional
  defaultSecurityScheme: "BearerAuth", // optional
  persistAuthorization: true, // persist authorization between reloads on the swagger page
  showFullPath: false, // the path displayed after endpoint summary
};
