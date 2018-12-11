import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StatusReport extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;
    @Column() automaticTestStatus: 'queued' | 'testing' | 'failed' | 'completed';
    @Column({ nullable: true }) automaticTestCompletedAt: Date;
}