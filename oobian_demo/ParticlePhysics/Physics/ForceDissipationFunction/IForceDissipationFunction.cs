using System;
using System.Collections.Generic;
using System.Text;
using SharpKit.JavaScript;

namespace Physics.ForceDissipationFunction
{
    [JsType(JsMode.Prototype, Filename = "IForceDissipationFunction.js")]
    internal abstract class IForceDissipationFunction
    {
        /// <summary>
        /// returns the multiplaction factor for a force applied from a distance, this function should return a value
        /// between 0 and 1.
        /// </summary>
        /// <param name="distance"></param>
        /// <returns></returns>
        public abstract double GetForceAtDistance(double distance);
    }
}
