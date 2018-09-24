const { format } = require('util');
const sinon = require('sinon');

const Axe = require('../../lib');
const beforeEach = require('./before-each');
const afterEach = require('./after-each');

const map = {
  log: 'log',
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  warn: 'warn',
  err: 'error',
  error: 'error',
  fatal: 'error'
};

module.exports = (test, logger = console) => {
  const { name } = logger.constructor;
  const levels = Object.keys(map).filter(level => logger[level]);

  test.beforeEach(beforeEach(logger));
  test.afterEach.always(afterEach);

  test(`${name} returns itself`, t => {
    t.true(t.context.axe instanceof Axe);
  });

  test(`${name} sets a config object`, t => {
    t.true(t.context.axe instanceof Axe);
  });

  test(`${name} sets the logger`, t => {
    t.true(t.context.axe.config.logger === logger);
  });

  test(`${name} returns array of levels`, t => {
    t.deepEqual(t.context.axe.config.levels, [
      'info',
      'warn',
      'error',
      'fatal'
    ]);
  });

  levels.forEach(level => {
    test(`${name} level ${level} works`, t => {
      const message = `test ${level} message`;
      t.context.axe[level](message);
      t.true(t.context[map[level]].calledWithMatch(message));
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} works with meta`, t => {
      const message = `${level} works with meta`;
      t.context.axe[level](message, { user: { username: 'test' } });
      t.true(t.context[map[level]].calledWithMatch(message));
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} works with Error as first argument`, t => {
      t.context.axe.config.showStack = true;
      const err = new Error(`test ${level} error`);
      t.context.axe[level](err);
      if (level === 'log') level = 'error';
      if (map[level] === 'error')
        t.true(
          t.context[map[level]].calledWith(
            sinon.match
              .instanceOf(Error)
              .and(sinon.match.has('name', err.name))
              .and(sinon.match.has('message', err.message))
          )
        );
      else t.true(t.context[map[level]].calledWithMatch(err.message));
      t.context.axe.config.showStack = false;
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} allows four or more args`, t => {
      const args = ['arg1', 'arg2', 'arg3', 'arg4', 'arg5'];
      t.context.axe[level](...args);
      const message = format(...args);
      t.true(t.context[map[level]].calledWithMatch(message));
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} allows message using placeholder token`, t => {
      const args = ['arg1 %s hello world', 'arg2'];
      t.context.axe[level](...args);
      const message = format(...args);
      t.true(t.context[map[level]].calledWithMatch(message));
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} converts a meta Array to String`, t => {
      const args = ['hello', [1, 2, 3]];
      t.context.axe[level](...args);
      const message = format(...args);
      t.true(t.context[map[level]].calledWithMatch(message));
    });
  });

  levels.forEach(level => {
    test(`${name} level ${level} converts message to String if not one`, t => {
      t.context.axe[level](false);
      t.true(t.context[map[level]].calledWithMatch('false'));
    });
  });

  if (levels.includes('log')) {
    test(`${name} log can be used like console.log(message)`, t => {
      t.context.axe.log('hello world');
      t.true(t.context.log.calledWithMatch('hello world'));
    });

    test(`${name} log can be used like console.log(message, meta)`, t => {
      const message = 'hello world';
      t.context.axe.log(message, { user: { username: 'test' } });
      t.true(t.context.log.calledWithMatch(message));
    });

    test(`${name} log can be used with util.format`, t => {
      const args = ['arg1', 'arg2', 'arg3', 'arg4', 'arg5'];
      t.context.axe.log(...args);
      t.true(t.context.log.calledWithMatch(format(...args)));
    });

    test(`${name} log can be used with placeholder tokens`, t => {
      const args = ['arg1 %s hello world', 'arg2'];
      const message = format(...args);
      t.context.axe.log(...args);
      t.true(t.context.log.calledWithMatch(message));
    });
  }
};
