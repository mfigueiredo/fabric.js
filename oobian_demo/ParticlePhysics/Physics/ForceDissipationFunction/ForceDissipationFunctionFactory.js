/*@Generated by SharpKit v4.23.8000*/
if (typeof($CreateDelegate)=='undefined'){
    if(typeof($iKey)=='undefined') var $iKey = 0;
    if(typeof($pKey)=='undefined') var $pKey = String.fromCharCode(1);
    $CreateDelegate = function(target, func){
        if (target == null || func == null) 
            return func;
        if(func.target==target && func.func==func)
            return func;
        if (target.$delegateCache == null)
            target.$delegateCache = {};
        if (func.$key == null)
            func.$key = $pKey + String(++$iKey);
        var delegate;
        if(target.$delegateCache!=null)
            delegate = target.$delegateCache[func.$key];
        if (delegate == null){
            delegate = function(){
                return func.apply(target, arguments);
            };
            delegate.func = func;
            delegate.target = target;
            delegate.isDelegate = true;
            if(target.$delegateCache!=null)
                target.$delegateCache[func.$key] = delegate;
        }
        return delegate;
    }
}
if(typeof(Physics) == "undefined")
    Physics = {};
if(typeof(Physics.ForceDissipationFunction) == "undefined")
    Physics.ForceDissipationFunction = {};
Physics.ForceDissipationFunction.ForceDissipationFunctionFactory = function()
{
}
Physics.ForceDissipationFunction.ForceDissipationFunctionFactory.InverseDistanceDissipationFunction = function(scaleFactor)
{
    return Physics.ForceDissipationFunction.ForceDissipationFunctionFactory.CreateDelegateFromInstance(new Physics.ForceDissipationFunction.InverseDistanceDissipationFunction(scaleFactor));
}
Physics.ForceDissipationFunction.ForceDissipationFunctionFactory.LinearDissipationFunction = function(distanceOfNoEffect)
{
    return Physics.ForceDissipationFunction.ForceDissipationFunctionFactory.CreateDelegateFromInstance(new Physics.ForceDissipationFunction.LinearForceDissipationFunction(distanceOfNoEffect));
}
Physics.ForceDissipationFunction.ForceDissipationFunctionFactory.CreateDelegateFromInstance = function(iidf)
{
    return $CreateDelegate(iidf,iidf.GetForceAtDistance);
}
