import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne } from 'typeorm';
import { Review } from './review.model';

@Entity()
export class PackageVersion extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;
    @OneToOne(type => Review, review => review.packageVersion) reviews: Review[];
}