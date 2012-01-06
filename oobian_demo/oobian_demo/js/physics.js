
var physics = physics || { version: "0.1" };

if (typeof exports != 'undefined') {
    exports.physics = physics;
}

var forceDissipationFunctionNS = function () {

    var result;

    function InverseDistanceFunction(scaleFactor) {
        var _scaleFactor = scaleFactor;

        /// <summary>
        /// creates an inverse distance dissipation function, this causes the force applied to decay asymptotically toward 0
        /// </summary>
        /// <param name="scaleFactor">Applies a linear scaling effect to the inverse distance decay rate (must NOT be 0)</param>
        function GetForceAtDistance(distance) {

            if ((distance * _scaleFactor) < 1) {
                return 1;
            }
            else {
                return 1 / (distance * _scaleFactor);
            }
        }
    }


    function LinearForceDissipationFunction(distanceOfNoEffect) {
        var _distanceOfNoEffect = distanceOfNoEffect;

        /// <summary>
        /// creates a linear dissipation function, this causes forces to decay at a linear rate toward 0
        /// </summary>
        /// <param name="distanceOfNoEffect">the distance at which no force will be applied (must NOT be 0)</param>
        function GetForceAtDistance(distance) {

            if (distance > _distanceOfNoEffect) {
                return 0;
            }
            else {
                return (_distanceOfNoEffect - distance) / _distanceOfNoEffect;
            }
        }
    }

    result.InverseDistanceFunction = InverseDistanceFunction;
    result.LinearForceDissipationFunction = LinearForceDissipationFunction;

    return result;
}

physics.ForceDissipationFunction = forceDissipationFunctionNS;