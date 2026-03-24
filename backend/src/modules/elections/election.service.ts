import { ElectionModel } from './election.model';
import { IElection } from './election.types';

export async function createElection(data: IElection) {
  return ElectionModel.create(data);
}

export async function getOpenElections() {
  return ElectionModel.find({ status: { $in: ['published', 'open'] } }).sort({ createdAt: -1 });
}