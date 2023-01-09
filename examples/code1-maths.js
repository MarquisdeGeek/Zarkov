const zarkov = require('../src/index');

module.exports = function() {

  let quadProgam = new zarkov.program();

  quadProgam.addSequence(new zarkov.exp((code) => {
    return [
      code.comment("Start here..."),
      code.output(zarkov.literal("Example code: double the 'start' param, then replace with 2*3")),
      code.assign('a', code.mul(zarkov.parameter('start'), zarkov.const(2)))
    ]
  }));

  quadProgam.addSequence(new zarkov.exp((code) => {
    return code.output(zarkov.literal("> "), zarkov.variable('a'));
  }));

  quadProgam.addSequence(new zarkov.exp((code) => {
    return code.assign('a', code.add(zarkov.const(2), zarkov.const(3)));
  }));

  quadProgam.addSequence(new zarkov.exp((code) => {
    return code.output(zarkov.literal("> "), zarkov.variable('a'));
  }));

  return quadProgam;
}
