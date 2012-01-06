
using SharpKit.JavaScript;

[assembly: JsMergedFile(Filename = "ParticlePhysics.js", Sources = new string[] {
    "ForceDissipationFunction/ForceDissipationFunctionFactory.js",
    "ForceDissipationFunction/IForceDissipationFunction.js",
    "ForceDissipationFunction/InverseDistanceDissipationFunction.js",
    "ForceDissipationFunction/LinearForceDissipationFunction.js",
    "ConnectorMetadata.js"
})]
