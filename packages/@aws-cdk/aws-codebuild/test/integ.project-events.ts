#!/usr/bin/env node
import codecommit = require('@aws-cdk/aws-codecommit');
import sns = require('@aws-cdk/aws-sns');
import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');
import { CodeCommitSource, Project } from '../lib';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-cdk-codebuild-events');

const repo = new codecommit.Repository(stack, 'MyRepo', { repositoryName: 'aws-cdk-codebuild-events' });
const project = new Project(stack, 'MyProject', { source: new CodeCommitSource(repo) });

const queue = new sqs.Queue(stack, 'MyQueue');

const topic = new sns.Topic(stack, 'MyTopic');
topic.subscribeQueue(queue);

// this will send an email with the JSON event for every state change of this
// build project.
project.onStateChange('StateChange', topic);

// this will send an email with the message "Build phase changed to <phase>".
// The phase will be extracted from the "completed-phase" field of the event
// details.
project.onPhaseChange('PhaseChange').addTarget(topic, {
  textTemplate: `Build phase changed to <phase>`,
  pathsMap: {
    phase: '$.detail.completed-phase'
  }
});

// trigger a build when a commit is pushed to the repo
const onCommitRule = repo.onCommit('OnCommit', project, 'master');
onCommitRule.addTarget(topic, {
  textTemplate: 'A commit was pushed to the repository <repo> on branch <branch>',
  pathsMap: {
    branch: '$.detail.referenceName',
    repo: '$.detail.repositoryName'
  }
});

app.run();
