const { join } = require('path');
const { writeFileSync } = require('fs');
const ora = require('ora');
const execa = require('execa');
const chalk = require('chalk');
const YAML = require('yaml');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    async prepare() {
        this.answers = await this.prompt([{
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

    async _createCompose() {
        const start = new Date();
        this.spinner.start('Creating docker-compose.yaml');
        try {
            this.fs.copyTpl(this.templatePath('docker-compose.yaml'),
                this.destinationPath('docker-compose.yaml'),
                { port: this.answers.port });
            const deltaT = new Date().getTime() - start.getTime();
            this.spinner.succeed('Creating docker-compose.yaml ' + chalk.green(`${deltaT} ms`));
        } catch(e) {
            this.spinner.fail();
            this.log(e.message);
            process.exit(1);
        }
    }

    async updateCompose() {
        let composePath = '';

        const yamlPath = this.destinationPath('docker-compose.yaml');
        if(this.fs.exists(yamlPath)) {
            composePath = yamlPath;
        }

        const ymlPath = this.destinationPath('docker-compose.yml');
        if(this.fs.exists(ymlPath)) {
            composePath = ymlPath;
        }

        if(!composePath) {
            return this._createCompose();
        }


        const start = new Date();
        this.spinner.start('Updating docker-compose');

        try {
            const composeText = this.fs.read(composePath);
            const compose = YAML.parse(composeText);
            compose.services.mocko = {
                image: 'gabrielctpinheiro/mocko-proxy:1.7.5',
                environment: [ 'PROXY_BASE-URI=' ],
                ports: [ this.answers.port + ':8080' ],
                volumes: [ './mocks:/home/mocko/mocks' ]
            };
            writeFileSync(composePath, YAML.stringify(compose));
            const deltaT = new Date().getTime() - start.getTime();
            this.spinner.succeed('Updating docker-compose ' + chalk.green(`${deltaT} ms`));
        } catch(e) {
            this.spinner.fail();
            this.log(e.message);
            process.exit(1);
        }
    }

    async pullContainers() {
        const start = new Date();
        this.spinner.start('Pulling container');
        try {
            await execa('docker', ['pull', 'gabrielctpinheiro/mocko-proxy:1.7.5']);
            const deltaT = (new Date().getTime() - start.getTime()) / 1000;
            this.spinner.succeed('Pulling container ' + chalk.green(`${deltaT.toFixed(1)} s`));
        } catch(e) {
            this.spinner.fail('Pulling container ' + chalk.grey('(skipped, optional)'));
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
        this.log(`${chalk.green('✔')} Mocko successfully added to your docker-compose!`);
        this.log('\nTo run the compose with your mocks, use:');
        this.log(chalk.dim(`$`), 'docker-compose up\n');
    }
};
