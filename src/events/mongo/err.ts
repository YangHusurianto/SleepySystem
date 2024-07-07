import chalk from 'chalk';

export default {
  name: 'err',
  execute(err: any) {
    console.log(
      chalk.red(
        `[Database Status]: An error has occurred with the database connection!\n${err}`
      )
    );
  },
};
