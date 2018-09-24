const elasticsearch = require('elasticsearch');
let elasticClient;

const getElasticInstance = () => {
    if (elasticClient)
        return elasticClient;
    elasticClient = new elasticsearch.Client({
        host: 'localhost:9200'
    });
    return elasticClient;
};

module.exports = {
    getElasticInstance: getElasticInstance,
};