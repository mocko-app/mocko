const { join } = require('path');
const execa = require('execa');
const ora = require('ora');
const chalk = require('chalk');
const npmAddScript = require('npm-add-script');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    async prepare() {
        this.answers = await this.prompt([{
            type: "input",
            name: "startScript",
            message: "What NPM script do you run for starting your application in dev mode?",
            default: 'start',
        }, {
            type: "number",
            name: "port",
            message: "In what port would you like Mocko to start?",
            default: 6625,
        }]);

        this.spinner = ora({
            message: 'Installing Mocko',
            color: 'green',
        });
    }

    async installDependencies() {
        const start = new Date();
        this.spinner.start('Installing NPM dependencies ' + chalk.dim('( @mocko/cli, concurrently )'));

        try {
            await execa('npm', ['i', '-D', '@mocko/cli', 'concurrently']);
            const deltaT = (new Date().getTime() - start.getTime()) / 1000;
            this.spinner.succeed('Installing NPM dependencies ' + chalk.green(`${deltaT.toFixed(1)} s`));
        } catch (e) {
            this.spinner.fail();
            this.log('Failed to run ' + chalk.yellow('npm i -D @mocko/cli concurrently') + '. Make sure your package.json is valid and npm is updated.');
            this.log(e.message);
            process.exit(1);
        }
    }

    async addScripts() {
        const start = new Date();
        this.spinner.start('Adding mock scripts ' + chalk.dim('( mocks, start:mocks )'));

        try {
            npmAddScript({
                key: 'mocks',
                value: `mocko --watch --port ${this.answers.port} ./mocks`,
                force: true,
            });
            npmAddScript({
                key: 'start:mocks',
                value: `concurrently -k -n "mocko,  app" "mocko --watch --port ${this.answers.port} ./mocks" "npm run ${this.answers.startScript}"`,
                force: true,
            });
            npmAddScript({
                key: 'test:mocks',
                value: `concurrently -k -n "mocko, test" "mocko --port ${this.answers.port} ./mocks" "npm test"`,
                force: true,
            });
            const deltaT = new Date().getTime() - start.getTime();
            this.spinner.succeed('Adding mock scripts ' + chalk.green(`${deltaT} ms`));
        } catch(e) {
            this.spinner.fail();
            this.log(e.message);
            process.exit(1);
        }
    }

    createDemoMocks() {
        const start = new Date();
        this.spinner.start('Creating demo mocks');

        try {
            this.fs.copy(this.templatePath('mocks.hcl'), this.destinationPath(join('mocks', 'mocks.hcl')));
            const deltaT = new Date().getTime() - start.getTime();
            this.spinner.succeed('Creating demo mocks ' + chalk.green(`${deltaT} ms`));
        } catch(e) {
            this.spinner.fail();
            this.log(e.message);
            process.exit(1);
        }
    }

    explainUsage() {
        this.log(`${chalk.green('✔')} Mocko is successfully installed in your project!`);
        this.log('\nTo run mocks on their own, use:');
        this.log(chalk.dim(`$`), 'npm run mocks');
        this.log('\nTo run your application and mocks, side by side, use:');
        this.log(chalk.dim(`$`), 'npm run start:mocks');
        this.log('\nTo run your tests with mocks, side by side, use:');
        this.log(chalk.dim(`$`), 'npm run test:mocks\n');
    }
};
