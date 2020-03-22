const { ClusterClient, ClientAlreadyLinkedError } = require('../../../cluster/client/cluster-client');

it('Ensure that link host throws exception when client is already linked', () => {
    const myClient = new ClusterClient();
    myClient.linkedHostId = 'some-id';
    expect(() => {
        myClient.linkHost('another-id');
    }).toThrow(ClientAlreadyLinkedError);
});
