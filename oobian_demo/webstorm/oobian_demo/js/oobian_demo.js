

function makeCircle(left, top, oLines, tLines)
{
    var circle = new fabric.Circle({
        left: left,
        top: top,
        radius: 20,
        fill: 'green',
        stroke: 'blue',
        opacity: 1
    });

    circle.hasControls = false;
    circle.outwardLines = oLines;
    circle.inwardLines = tLines

    return circle;
}

function makeLine(coords)
{
    var line = new fabric.Line(coords,
				{
				    selectable: false,
				    opacity: 0.5,
				    fill: 'blue',
                    defaultSize: 100
				});

    return line;
}

function initObjs(ctx)
{
    ctx.clear();

    var
    line = makeLine([100, 100, 200, 200]),
    line1 = makeLine([100, 100, 200, 100]),
    line2 = makeLine([100, 100, 100, 200]);

    ctx.add(line, line1, line2);

    ctx.add(
				makeCircle(line.get('x1'), line.get('y1'), [line, line1, line2], null),
				makeCircle(line.get('x2'), line.get('y2'), null, [line]),
				makeCircle(line1.get('x2'), line1.get('y2'), null, [line1]),
				makeCircle(line2.get('x2'), line.get('y2'), null, [line2])
			);
    /*ctx.add(
        makeCircle(line.get('x1'), line.get('y1'), [line], null),
        makeCircle(line.get('x2'), line.get('y2'), null, [line])
    );*/
}


function integratePhysicsModel(objs,
    top, left, width, height, gravity, frictionConstant, staticFriction,
    connectionLength, connectionSpringConstant, forceDissipationFunction,
    particlesMass, particlesRepulsionForce)
{
    var circles = [];
    var lines = [];

    // simulation initialization
    var simulation = new physics.ParticleSimulation(
        top, left, width, height, gravity, frictionConstant, staticFriction,
        connectionLength, connectionSpringConstant, forceDissipationFunction);
    
    for(var i in objs)
    {
        var object = objs[i];

        if (object.isType('circle'))
        {
            circles.push(object);
        }
        else if (object.isType('line'))
        {
            lines.push(object);
        }
    }

    // each circle is a physics point
    // each circle repels other circles
    // restingForce = repulsion force
    for(var i in circles)
    {
        var circle = circles[i];

        // prevent the addiction of circle representation more than 1 time
        if (simulation.HasParticleMetadata(circle)) continue;

        // add circle to simulation
        var particle = new physics.Particle(particlesMass, particlesRepulsionForce, forceDissipationFunction);
        simulation.AddParticle(particle, circle);

        // add circle and outward {lines and circles} representations
        if (circle.outwardLines == null)
        {
            continue;
        }

        // for each outward line
        for(var j in circle.outwardLines)
        {
            var outwardLine = circle.outwardLines[j];
            var outwardCircle = {};

            // check which circle has the line has an inward line
            for(var k in circles)
            {
                var innerLoopCircle = circles[k];

                if (circle == innerLoopCircle)
                {
                    continue;
                }

                if (innerLoopCircle.inwardLines == null)
                {
                    continue;
                }

                for(var l in innerLoopCircle.inwardLines)
                {
                    var inwardLine = innerLoopCircle.inwardLines[l];

                    if (inwardLine == outwardLine)
                    {
                        if (simulation.HasParticleMetadata(innerLoopCircle))
                        {
                            var error = "The outwardParticle was already in the simulation";
                            alert(error);
                            throw error;
                        }
                        else
                        {
                            outwardCircle = innerLoopCircle;

                            // and add outward circle and line representation
                            var outwardParticle = new physics.Particle(particlesMass, particlesRepulsionForce, forceDissipationFunction);
                            simulation.AddParticleToParticle(outwardParticle, outwardCircle, particle, inwardLine);

                            break;
                        }
                    }
                }
            }

        }
    }

    return simulation;
}

function refreshObjectPositions(simulation)
{
    // cycles trough all particles
    for(var i in simulation.GetParticles())
    {
        var particle = simulation.GetParticles()[i];
        var circle = particle.GetMetaData();

        // update the "from" circle
        var particlePosition = particle.GetPosition();
        circle.left = particlePosition.GetX();
        circle.top = particlePosition.GetY();

        for(var j in particle.GetConnectors())
        {
            var connector = particle.GetConnectors()[j];

            // updates lines on outward direction only
            if (connector.GetParticle1() == particle)
            {
                var line = connector.GetMetaData();
                var particle1Position = connector.GetParticle1().GetPosition();
                var particle2Position = connector.GetParticle2().GetPosition();

                // update line
                line.set('x1', particle1Position.GetX());
                line.set('y1', particle1Position.GetY());
                line.set('x2', particle2Position.GetX());
                line.set('y2', particle2Position.GetY());
            }
        }
    }
}

function setSimulationPositions(simulation)
{
    // cycles trough all particles
    for(var i in simulation.GetParticles())
    {
        var particle = simulation.GetParticles()[i];
        var circle = particle.GetMetaData();

        // update the "from" circle
        var position = new physics.Vector(circle.left, circle.top);
        particle.SetPosition(position);
        particle.SetPreviousPosition(position); // update previous position also

        for(var j in particle.GetConnectors())
        {
            var connector = particle.GetConnectors()[j];

            // updates lines on outward direction only
            if (connector.GetParticle1() == particle)
            {
                var line = connector.GetMetaData();
                var position1 = new physics.Vector(line.get('x1'), line.get('y1'));
                var position2 = new physics.Vector(line.get('x2'), line.get('y2'));

                // update line
                connector.GetParticle1().SetPosition(position1);
                connector.GetParticle1().SetPreviousPosition(position1); // update previous position also
                connector.GetParticle2().SetPosition(position2);
                connector.GetParticle2().SetPreviousPosition(position2); // update previous position also
            }
        }
    }
}