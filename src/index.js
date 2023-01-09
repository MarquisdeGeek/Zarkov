const Zarkov= {};

Zarkov.const = function(value) {
  return {
    redo: function(/*state not needed for constants*/) { return value; },
  }
}

Zarkov.literal = function(value) { // This is intentionally identical to const (true in typeless langs only)
  return {
    redo: function(/*state not needed for (string) literal*/) { return value; },
  }
}

Zarkov.parameter = function(name) {
  return {
    redo: function(state) { return state.getParameter(name); },
  }
}

Zarkov.variable = function(name) {
  return {
    redo: function(state) { return state.getVariable(name); },
  }
}

Zarkov.processState = function() {
  let running;
  let varlist;
  let paramlist;
  let reason;
  let debugOptions = {};

  (function ctor() {
    coldRestart();
  })();

  function debug(options) {
    debugOptions = options;
  }

  function getStateDump() {
    return ""+
      Object.keys(paramlist).map((p) => {
        return `p.${p}=${paramlist[p]}`;
      }).join(", ") + 
      "  " + 
      Object.keys(varlist).map((v) => {
        return `v.${v}=${varlist[v]}`;
      }).join(", ") + 
      "";
  }

  function coldRestart() {
    varlist = {};
    paramlist = {};

    warmRestart();
  }

  function warmRestart() {
    running = true;
    reason = "running";
  }

  function terminate(whyTerminated = "termination") {
    running = false;
    reason = whyTerminated;
  }

  return {
    // Parameters
    getParameter: function(name) {
      return paramlist[name];
    },
    setParameter: function(name, value) {
      paramlist[name] = value;
    },

    // Variables
    getVariable: function(name) {
      return varlist[name];
    },
    setVariable: function(name, value) {
      varlist[name] = value;
      //
      if (debugOptions.breakAt && debugOptions.breakAt[name]) {
        let breakNow = debugOptions.breakAt[name](name, value);
        if (breakNow) {
          terminate(`Breakpoint on variable '${name}' set to '${value}'`);
        }
      }
    },

    // Process state
    isRunning: function() {
      return running;
    },
    getRunningState: function() {
      return reason;
    },
    terminate,
    restart: function() {
      warmRestart();
    },
    debug,
    getStateDump
  }
}

Zarkov.process = function(instrList_) {
  let instrList = instrList_;
  let pc;
  let state;
  let debugOptions = {};

  (function ctor() {
    state = new Zarkov.processState();
    start()
  })();

  function debug(options) {
    state.debug(options);
    debugOptions = options;
  }

  function run(parameters) {
    start();

    Object.keys(parameters).forEach((name) => {
      const value = parameters[name].redo(state);
      state.setParameter(name, value);

      if (debugOptions.showState) {
        console.log(`PARAMS : '${name}' = ${value}`);
      }
    });

    while(state.isRunning()) {
      let thisInstruction = pc;

      if (debugOptions.trace) {
        console.log(`TRACE: ${thisInstruction} : ${instrList[thisInstruction].rem(state)}`);
      }

      if (debugOptions.showState) {
        console.log(`(pre-state: ${state.getStateDump()})`);
      }

      step();

      if (debugOptions.showState) {
        console.log(`(post-state: ${state.getStateDump()})`);
      }

    }

  }

  function start() {
    pc = 0;
    restart();
    return state;
  }

  function step() {
    instrList[pc].redo(state);
    ++pc;
    if (pc >= instrList.length) {
      state.terminate();
    }
    return state;
  }

  function back() {
    --pc;
    instrList[pc].undo(state);

    if (pc <= 0) {
      state.terminate();
    }

    return state;
  }

  function restart() {
    state.restart();
    return state;
  }
  //
  return {
    debug,
    //
    run,
    restart,
    start,
    step,
    back
  }
}

Zarkov.program = function() {
  let instrList = [];

  function addSequence(sequenceList) {
    instrList = [ ...instrList, ...sequenceList ];
  }

  function compile() {
    return new Zarkov.process(instrList);
  }

  return {
    addSequence,
    compile,
  }
}


Zarkov.expression = function(blockFn) {

  function interpreter(instrList) {
    function add(a, b) {
      const redo = function(state) { return a.redo(state) + b.redo(state); }
      instrList.push( {
        redo: function(state) {
          return redo(state)
        }
        ,
        undo: function() {
        }
        ,
        rem: function(state) {
          return `${a.redo(state)} + ${b.redo(state)}`;
        }
      });

      return {
        redo,
      }
    }

    function sub(a, b) {
      const redo = function(state) { return a.redo(state) - b.redo(state); }
      instrList.push( {
        redo: function(state) {
          return redo(state)
        }
        ,
        undo: function() {
        }
        ,
        rem: function(state) {
          return `${a.redo(state)} - ${b.redo(state)}`;
        }
      });

      return {
        redo,
      }
    }

    function mul(a, b) {
      const redo = function(state) { return a.redo(state) * b.redo(state); }
      instrList.push( {
        redo: function(state) {
          return redo(state);
        }
        ,
        undo: function() {
        }
        ,
        rem: function(state) {
          return `${a.redo(state)} * ${b.redo(state)}`;
        }
      });
      // Ahh.. we need to return a fn that does the REDO.. and somehow UNDO at the same time
      return {
        redo,
      }
    }


    function assign(name, value) {
      let previous = [];
      const redo = function(state) {
        previous.push(state.getVariable(name));
        state.setVariable(name, value.redo(state));
        return value;
      };

      instrList.push( {
        redo: function(state) {
          return redo(state);
        }
        ,
        undo: function(state) {
          state.setVariable(name, previous.pop());
        }
        ,
        rem: function(state) {
          return `${name} = ${value.redo(state)}`;
        }
      });
      return {
        redo
      }
    }

    function output() {
      let outputArguments = arguments;
      
      function getOutput(state) {
        let joined = "";
        for(let arg in outputArguments) {
          joined += outputArguments[arg].redo(state);
        }
        return joined;
      }

      instrList.push( {
        redo: function(state) {
          console.log(getOutput(state));
        }
        ,
        undo: function(state) {
          // Ideally, undo'ing an output was delete the text, but then we wouldn't see the backwards progress!
          console.log(getOutput(state));
        }
        ,
        rem: function(state) {
          return `output '${getOutput(state)}'`;
        }
      });
    }

    function comment(msg) {
      instrList.push( {
        redo: function(state) {
        }
        ,
        undo: function(state) {
        }
        ,
        rem: function(state) {
          return `REM '${msg}'`;
        }
      });
    }

    return {
      add,
      sub,
      subtract: sub,
      mul,
      assign,
      //
      output,
      comment,
    }
  }

  //
  let instrList = []
  blockFn(new interpreter(instrList));
  return instrList;
}
// Sugar
Zarkov.exp = Zarkov.expression;

module.exports = Zarkov;
