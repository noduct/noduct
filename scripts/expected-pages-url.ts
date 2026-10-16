import { topology } from '@noduct/tool-runtime';

process.stdout.write(topology.hubUrl().replace(/\/$/, ''));
