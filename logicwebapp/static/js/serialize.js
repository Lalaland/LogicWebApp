define(["shapes","wires","gates","logicProcessor"],function(shapes,wires,gates,logicProcessor)
{
	"use strict";

	var obj = {};

	function giveId(array)
	{
		var i = 0;
		for (i =0; i < array.length;i++)
		{
			array[i].id = i;
		}
	}

	function mapId(array)
	{
		return array.map(function (o)
		{
			return o.id;
		});
	}

	function unmapId(array,source)
	{
		return array.map(function (o)
		{
			return source[o];
		});
	}


	obj.deserialize = function(message,json)
	{
		console.log(message);

		json.currentPositions = mapPrototype(json.currentPositions,shapes.Position.prototype);
		console.log(json.currentPositions);

		json.currentPositions.forEach(function (pos)
		{
			if (pos.oldPos !== undefined)
			{
				pos.oldPos = json.currentPositions[pos.oldPos];
			}
		});

		var state = JSON.parse(message,function(key,value)
		{
			if (key === "pos" || key === "firstPosition" || key === "secondPosition" || key === "oldPos")
			{
				return json.currentPositions[value];
			}
			else if (key === "rect")
			{
				return $.extend(Object.create(shapes.Rect.prototype),value);
			}
			else if (key === "circle")
				return $.extend(Object.create(shapes.Circle.prototype),value);
			else if (key === "line")
				return $.extend(Object.create(shapes.Line.prototype),value);
			else if (key === "logic")
			{
				var l =  $.extend(Object.create(logicProcessor.LogicProcessor.prototype),value);
				l.setInputAndOutput();
				return l;
			}

			else
				return value;
		});
		
		state.currentPositions = json.currentPositions;

		relinkPrototpye(state);
		relinkState(state);
		

		

		console.log(state);

		return state;

	};

	function mapPrototype(arr,proto)
	{
		return arr.map(function (thing)
		{
			return $.extend(Object.create(proto),thing);
		});
	}


	function relinkPrototpye(state)
	{
		state.currentNodes = mapPrototype(state.currentNodes,wires.Node.prototype);
		state.currentGates = mapPrototype(state.currentGates,gates.Gate.prototype);
		state.currentWires = mapPrototype(state.currentWires,wires.Wire.prototype);

	}

	function relinkState(state)
	{
		state.currentNodes.forEach(function (node)
		{
			if (node.gate !== null)
				node.gate = state.currentGates[node.gate];

			node.wires = unmapId(node.wires,state.currentWires);
		});

		state.currentGates.forEach(function (gate)
		{
			gate.nodes = unmapId(gate.nodes,state.currentNodes);
			gate.inputNodes = unmapId(gate.inputNodes,state.currentNodes);
			gate.outputNodes = unmapId(gate.outputNodes,state.currentNodes);

		});

		state.currentWires.forEach(function (wire)
		{
			wire.startNode = state.currentNodes[wire.startNode];
			wire.stopNode = state.currentNodes[wire.stopNode];
		});
	}

	obj.serialize = function(state)
	{

		giveId(state.currentNodes);
		giveId(state.currentGates);
		giveId(state.currentWires);

		giveId(shapes.allPositions);

		state.currentNodes.forEach(function (node)
		{
			if (node.gate)
				node.gate = node.gate.id;

			node.wires = mapId(node.wires);
		});

		state.currentGates.forEach(function (gate)
		{
			gate.nodes = mapId(gate.nodes);
			gate.inputNodes = mapId(gate.inputNodes);
			gate.outputNodes = mapId(gate.outputNodes);

			if (gate.logic)
			{


				console.log(gate.logic);
				var newLogic = {

					gates:
					gate.logic.gates.map(function (gate)
					{
						var tmp =  {inputGroups: gate.inputGroups, outputGroups: gate.outputGroups,type : gate.type, yValue: gate.yValue};
						if (gate.type === "composite")
							tmp.logic = gate.logic;

						return tmp;
					}),

					statusForGroups : gate.logic.statusForGroups,
					wiresForGroup : gate.logic.wiresForGroup.map(function () {return [];})







				};


				console.log(newLogic);

				gate.logic = newLogic;
			}
		});

		state.currentWires.forEach(function (wire)
		{
			wire.startNode = wire.startNode.id;
			wire.stopNode = wire.stopNode.id;

		});

		state.currentPositions = shapes.allPositions;

		var result = JSON.stringify(state,function(key,value)
		{
			if (key === "pos" || (value && key === "oldPos") || key === "firstPosition" || key === "secondPosition")
			{
				return value.id;
			}
			else
				return value;
		});

		
		relinkState(state);



		return result;
		



	};

	return obj;
});