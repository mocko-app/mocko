const Generator = require('yeoman-generator');

const Installation = {
    NPM: 'mocko:npm',
    COMPOSE: 'mocko:compose',
};

module.exports = class extends Generator {

    async chooseGenerator() {
        const answers = await this.prompt([{
            type: "list",
            name: "installation",
            message: "How would you like to install Mocko?",
            choices: [
                { name: "As an NPM script (NodeJS only)", value: Installation.NPM },
                { name: "In a docker-compose (Requires docker)", value: Installation.COMPOSE }
            ]
        }]);

        return this.composeWith(answers.installation);
    }
};
