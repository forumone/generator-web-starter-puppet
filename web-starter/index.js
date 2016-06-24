'use strict';
var generators = require('yeoman-generator'),
  _ = require('lodash'),
  pkg = require('../package.json'),
  Promise = require('bluebird');

module.exports = generators.Base.extend({
  initializing : {
    async : function() {
      this.options.addDevDependency(pkg.name, '~' + pkg.version);
    }
  },
  prompting : function() {
    var done = this.async();
    var that = this;
    var config = _.extend({
      host : 'f1dev',
      vhost : '/vagrant/public',
      database : true,
      db_name : 'web',
      db_user : 'web',
      php_version : 'php55u',
      solr : true
    }, this.config.getAll());

    return new Promise(function(resolve, reject) {
      that.prompt([{
        type : 'list',
        name : 'host',
        message : 'Which host will it be deployed to?',
        default : config.host,
        choices : [{
          name : 'F1',
          value : 'f1dev',
        },
        {
          name : 'Acquia',
          value : 'acquia',
        },
        {
          name : 'Pantheon',
          value : 'pantheon',
        }]
      },
      {
        type : 'input',
        name : 'vhost',
        message : 'What is the path to the virtual host?',
        default : config.vhost,
      },
      {
        type : 'confirm',
        name : 'database',
        message : 'Does this project need a database?',
        default : config.database,
      },
      {
        type : 'input',
        name : 'db_name',
        message : 'What is the name of the database?',
        default : config.db_name,
        when : function(answers) {
          return answers.database;
        }
      },
      {
        type : 'input',
        name : 'db_user',
        message : 'What is the user connecting to the database?',
        default : config.db_user,
        when : function(answers) {
          return answers.database;
        }
      },
      {
        type : 'list',
        name : 'php_version',
        message : 'Which version of PHP to use?',
        default : config.php_version,
        choices : [{
          name : 'None',
          value : ''
        },
        {
          name : '5.3',
          value : 'php'
        },
        {
          name : '5.4',
          value : 'php54u'
        },
        {
          name : '5.5',
          value : 'php55u'
        },
        {
          name : '5.6',
          value : 'php56u'
        }]
      },
      {
        type: 'confirm',
        name: 'solr',
        message: 'Does it use Solr?',
        default: config.solr,
      }], function(answers) {
          resolve(answers);
      });
    }).then(function(answers) {
      that.config.set(answers);

      answers.config = {};
      // Expose the answers on the parent generator
      _.extend(that.options.parent.answers, { 'web-starter-puppet' : answers });
    }).finally(function() {
      done();
    });
  },
  writing : {
    // Write Puppet manifest file
    init : function() {
      var done = this.async();

      // Get current system config for this sub-generator
      var config = this.options.parent.answers['web-starter-puppet'];

      // Set default platform
      config.platform = 'drupal';

      _.extend(config, this.options.parent.answers);

      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/hosts/acquia.yaml'),
        this.destinationPath('puppet/manifests/hieradata/hosts/acquia.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/hosts/f1dev.yaml'),
        this.destinationPath('puppet/manifests/hieradata/hosts/f1dev.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/hosts/pantheon.yaml'),
        this.destinationPath('puppet/manifests/hieradata/hosts/pantheon.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/platforms/' + config.platform + '.yaml'),
        this.destinationPath('puppet/manifests/hieradata/platforms/' + config.platform + '.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/common.yaml'),
        this.destinationPath('puppet/manifests/hieradata/common.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hiera.yaml'),
        this.destinationPath('puppet/manifests/hiera.yaml'),
        config
      );
      this.fs.copyTpl(
        this.templatePath('puppet/manifests/init.pp'),
        this.destinationPath('puppet/manifests/init.pp'),
        config
      );

      done();
    },
    // Write Hiera site file
    site : function() {
      var done = this.async();

      // Get current system config for this sub-generator
      var config = this.options.parent.answers['web-starter-puppet'];
      _.extend(config, this.options.parent.answers);

      this.fs.copyTpl(
        this.templatePath('puppet/manifests/hieradata/sites/localhost.yaml'),
        this.destinationPath('puppet/manifests/hieradata/sites/localhost.yaml'),
        config
      );

      done();
    }
  }
});
