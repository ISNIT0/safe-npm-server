import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Report } from './report.model';

@Entity()
export class PackageVersion extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;

    @OneToMany(type => Report, report => report.packageVersion, { eager: true })
    reports: Report[];
}