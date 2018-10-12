import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import lb = require('@aws-cdk/aws-elasticloadbalancing');
import cdk = require('@aws-cdk/cdk');
import codedeploy = require('../lib');

const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-cdk-codedeploy-server-dg');

const vpc = new ec2.VpcNetwork(stack, 'VPC');

const asg = new autoscaling.AutoScalingGroup(stack, 'ASG', {
  instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.M5, ec2.InstanceSize.Large),
  machineImage: new ec2.AmazonLinuxImage(),
  vpc,
});

const elb = new lb.LoadBalancer(stack, 'ELB', { vpc });
elb.addListener({
  externalPort: 80,
});

new codedeploy.ServerDeploymentGroup(stack, 'CodeDeployGroup', {
  deploymentConfig: codedeploy.ServerDeploymentConfig.AllAtOnce,
  autoScalingGroups: [asg],
  loadBalancer: elb,
  autoRollback: {
    failedDeployment: false,
    stoppedDeployment: false,
    deploymentInAlarm: false,
  },
});

app.run();
